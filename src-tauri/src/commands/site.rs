use crate::error::{Error, Result};
use crate::state::{AppState, Run};
use serde_json::{json, Value};
use tauri::utils::config::Color;
use tauri::{AppHandle, Manager};
use tokio::sync::oneshot;

/// `show*` and `delete*` share a target because deleting always happens on the page that
/// lists the items.
fn target_url(platform: &str, action: &str, user_name: &str) -> Option<String> {
    let user = urlencoding_minimal(user_name);
    let url = match (platform, action) {
        ("x", "showPosts" | "deletePosts") => {
            format!("https://x.com/search?q=from%3A{user}&src=typed_query")
        }
        ("x", "showReplies" | "deleteReplies") => format!("https://x.com/{user}/with_replies"),
        ("x", "showReposts" | "deleteReposts") => format!("https://x.com/{user}"),
        ("x", "showLikes" | "deleteLikes") => format!("https://x.com/{user}/likes"),
        ("x", "showFollowing" | "deleteFollowing") => format!("https://x.com/{user}/following"),
        ("youtube", "showComments" | "deleteComments") => {
            "https://myactivity.google.com/page?hl=en&page=youtube_comments".to_string()
        }
        ("youtube", "showLikes" | "deleteLikes") => {
            "https://www.youtube.com/playlist?list=LL".to_string()
        }
        _ => return None,
    };
    Some(url)
}

/// X handles are `[A-Za-z0-9_]`, so percent-encoding only has to defend against a handle
/// that never should have got this far rather than implement general URL encoding.
fn urlencoding_minimal(input: &str) -> String {
    input
        .chars()
        .filter(|c| c.is_ascii_alphanumeric() || *c == '_')
        .collect()
}

fn engine_action(action: &str) -> Option<&'static str> {
    match action {
        "deletePosts" => Some("deletePosts"),
        "deleteReplies" => Some("deleteReplies"),
        "deleteReposts" => Some("deleteReposts"),
        "deleteLikes" => Some("deleteLikes"),
        "deleteFollowing" => Some("deleteFollowing"),
        "deleteComments" => Some("deleteComments"),
        _ => None,
    }
}

fn read_user_name(app: &AppHandle) -> String {
    app.state::<AppState>()
        .site
        .lock()
        .expect("site mutex")
        .user_name
        .clone()
}

pub fn navigate(app: &AppHandle, params: &Value) -> Result<Value> {
    let platform = params
        .get("platform")
        .and_then(Value::as_str)
        .ok_or(Error::MissingParam("platform"))?;
    let action = params
        .get("action")
        .and_then(Value::as_str)
        .ok_or(Error::MissingParam("action"))?;

    let user = read_user_name(app);
    let url = target_url(platform, action, &user).ok_or_else(|| Error::NoTarget {
        platform: platform.to_string(),
        action: action.to_string(),
    })?;

    let site = app
        .get_webview(crate::site_webview_label(platform))
        .ok_or_else(|| Error::Site("site webview is gone".into()))?;
    site.eval(format!("window.location.assign({});", json!(url)))?;
    Ok(json!({ "ok": true }))
}

pub async fn run_action(app: AppHandle, params: &Value) -> Result<Value> {
    let request_id = params
        .get("requestId")
        .and_then(Value::as_str)
        .ok_or(Error::MissingParam("requestId"))?
        .to_string();
    let platform = params
        .get("platform")
        .and_then(Value::as_str)
        .ok_or(Error::MissingParam("platform"))?;
    let action = params
        .get("action")
        .and_then(Value::as_str)
        .ok_or(Error::MissingParam("action"))?;
    let engine = engine_action(action)
        .ok_or_else(|| Error::Message(format!("{action} is not a delete action")))?;

    let timeouts = params.get("timeouts").cloned().unwrap_or(json!({}));
    let wait_after_delete = timeouts
        .get("waitAfterDelete")
        .and_then(Value::as_u64)
        .unwrap_or(500);
    let wait_between = timeouts
        .get("waitBetweenRetryDeleteAttempts")
        .and_then(Value::as_u64)
        .unwrap_or(500);

    let (tx, rx) = oneshot::channel();
    {
        let state = app.state::<AppState>();
        state.runs.0.lock().expect("runs mutex").insert(
            request_id.clone(),
            Run {
                deleted: 0,
                responder: Some(tx),
            },
        );
    }

    // `userName` is only read by deleteReplies, but passing it always keeps the call
    // site uniform; the engine reads it straight out of the page for the others.
    let run_params = json!({
        "requestId": request_id,
        "waitAfterDelete": wait_after_delete,
        "waitBetweenRetryDeleteAttempts": wait_between,
    });
    let script = format!(
        "(function () {{ var p = {run_params}; \
           if (window.__cmp) {{ p.userName = window.__cmp.getUserName(); \
             window.__cmp.run('{platform}', '{engine}', JSON.stringify(p)); }} \
           else {{ window.chrome.webview.postMessage({{ type: 'error', requestId: '{request_id}', \
             message: 'The delete engine is not loaded on this page.' }}); }} }})();"
    );

    let evaluated = app
        .get_webview(crate::site_webview_label(platform))
        .ok_or_else(|| Error::Site("site webview is gone".into()))
        .and_then(|site| site.eval(&script).map_err(Error::from));

    if let Err(error) = evaluated {
        app.state::<AppState>()
            .runs
            .0
            .lock()
            .expect("runs mutex")
            .remove(&request_id);
        return Err(error);
    }

    match rx.await {
        Ok(Ok(deleted)) => Ok(json!({ "deletedCount": deleted })),
        Ok(Err(message)) => Err(Error::Message(message)),
        Err(_) => Err(Error::Abandoned),
    }
}

/// Cancels by reloading the site webview: the engine has no cancellation primitive, so
/// tearing down the page is what actually stops its click loop.
pub fn cancel_action(app: &AppHandle, params: &Value) -> Result<Value> {
    let request_id = params
        .get("requestId")
        .and_then(Value::as_str)
        .unwrap_or("")
        .to_string();

    let state = app.state::<AppState>();
    let mut runs = state.runs.0.lock().expect("runs mutex");
    if let Some(run) = runs.get_mut(&request_id) {
        if let Some(responder) = run.responder.take() {
            let _ = responder.send(Ok(run.deleted));
        }
        runs.remove(&request_id);
    }
    drop(runs);

    if let Some(site) = app.get_webview(crate::active_site_webview_label()) {
        let _ = site.eval("window.location.reload();");
    }
    Ok(Value::Null)
}

pub fn hide(app: &AppHandle, params: &Value) -> Result<Value> {
    let hide = params.get("hide").and_then(Value::as_bool).unwrap_or(false);
    crate::set_site_hidden(app, hide);
    Ok(Value::Null)
}

pub fn show(app: &AppHandle, params: &Value) -> Result<Value> {
    let platform = params
        .get("platform")
        .and_then(Value::as_str)
        .ok_or(Error::MissingParam("platform"))?;
    crate::show_site(app, platform);
    Ok(Value::Null)
}

pub fn reload(app: &AppHandle) -> Result<Value> {
    if let Some(site) = app.get_webview(crate::active_site_webview_label()) {
        site.eval("window.location.reload();")?;
    }
    Ok(Value::Null)
}

pub fn set_chrome_width(app: &AppHandle, params: &Value) -> Result<Value> {
    let width = params
        .get("width")
        .and_then(Value::as_f64)
        .map(|value| value.round().max(1.0) as u32)
        .unwrap_or(crate::DEFAULT_CHROME_WIDTH);
    crate::set_chrome_width(app, width);
    Ok(Value::Null)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn builds_every_x_page() {
        assert_eq!(
            target_url("x", "deletePosts", "someuser").unwrap(),
            "https://x.com/search?q=from%3Asomeuser&src=typed_query"
        );
        assert_eq!(
            target_url("x", "showReplies", "someuser").unwrap(),
            "https://x.com/someuser/with_replies"
        );
        assert_eq!(
            target_url("x", "deleteReposts", "someuser").unwrap(),
            "https://x.com/someuser"
        );
        assert_eq!(
            target_url("x", "deleteLikes", "someuser").unwrap(),
            "https://x.com/someuser/likes"
        );
        assert_eq!(
            target_url("x", "showFollowing", "someuser").unwrap(),
            "https://x.com/someuser/following"
        );
    }

    /// `show*` and `delete*` land on the same page; deleting happens where the items are
    /// listed, so a divergence here would send a delete run to a page with nothing on it.
    #[test]
    fn show_and_delete_share_a_target() {
        for (show, delete) in [
            ("showPosts", "deletePosts"),
            ("showReplies", "deleteReplies"),
            ("showReposts", "deleteReposts"),
            ("showLikes", "deleteLikes"),
            ("showFollowing", "deleteFollowing"),
        ] {
            assert_eq!(
                target_url("x", show, "someuser"),
                target_url("x", delete, "someuser"),
                "{show} and {delete} disagree"
            );
        }
    }

    #[test]
    fn youtube_pages_ignore_the_handle() {
        assert_eq!(
            target_url("youtube", "deleteComments", "").unwrap(),
            "https://myactivity.google.com/page?hl=en&page=youtube_comments"
        );
        assert_eq!(
            target_url("youtube", "showLikes", "").unwrap(),
            "https://www.youtube.com/playlist?list=LL"
        );
    }

    #[test]
    fn unknown_combinations_have_no_target() {
        assert!(target_url("x", "deleteComments", "someuser").is_none());
        assert!(target_url("youtube", "deleteFollowing", "").is_none());
        assert!(target_url("mastodon", "deletePosts", "someuser").is_none());
    }

    #[test]
    fn handle_is_stripped_of_anything_that_could_escape_the_path() {
        assert_eq!(urlencoding_minimal("some_user1"), "some_user1");
        assert_eq!(urlencoding_minimal("../../etc"), "etc");
        assert_eq!(urlencoding_minimal("a/b?c=d#e"), "abcde");
    }

    #[test]
    fn only_delete_actions_reach_the_engine() {
        assert_eq!(engine_action("deletePosts"), Some("deletePosts"));
        assert_eq!(engine_action("deleteComments"), Some("deleteComments"));
        assert_eq!(engine_action("showPosts"), None);
        assert_eq!(engine_action("nonsense"), None);
    }
}

/// Paints the window and the chrome webview in the app's own background colour.
///
/// Resizing a webview exposes pixels the page has not drawn into yet, and WebView2 fills
/// those with its default — a black band for as long as it takes the page to repaint. That
/// is what the user sees when the action panel opens. Giving the surfaces the colour the
/// page is about to paint anyway makes the gap invisible instead of black.
pub fn set_background(app: &AppHandle, params: &Value) -> Result<Value> {
    let hex = params
        .get("color")
        .and_then(Value::as_str)
        .ok_or(Error::MissingParam("color"))?;
    let color = parse_hex_color(hex).ok_or_else(|| Error::Message(format!("bad colour {hex}")))?;

    if let Some(window) = app.get_window("main") {
        let _ = window.set_background_color(Some(color));
    }
    if let Some(chrome) = app.get_webview("chrome") {
        let _ = chrome.set_background_color(Some(color));
    }
    Ok(Value::Null)
}

fn parse_hex_color(hex: &str) -> Option<Color> {
    let digits = hex.strip_prefix('#')?;
    if digits.len() != 6 {
        return None;
    }
    let channel = |at: usize| u8::from_str_radix(&digits[at..at + 2], 16).ok();
    Some(Color(channel(0)?, channel(2)?, channel(4)?, 255))
}

#[cfg(test)]
mod background_tests {
    use super::parse_hex_color;

    #[test]
    fn parses_a_six_digit_hex_colour() {
        let color = parse_hex_color("#1A2B3C").expect("valid");
        assert_eq!(
            (color.0, color.1, color.2, color.3),
            (0x1A, 0x2B, 0x3C, 255)
        );
    }

    #[test]
    fn rejects_anything_that_is_not_six_hex_digits() {
        assert!(parse_hex_color("1A2B3C").is_none());
        assert!(parse_hex_color("#ABC").is_none());
        assert!(parse_hex_color("#GGGGGG").is_none());
    }
}
