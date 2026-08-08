use crate::error::{Error, Result};
use crate::state::{AppState, Run};
use serde_json::{json, Value};
use tauri::utils::config::Color;
use tauri::{AppHandle, Manager};
use tokio::sync::oneshot;

/// `show*` and `delete*` share a target because deleting always happens on the page that
/// lists the items.
///
/// Every url asks for English, whatever the app is set to. The engine finds the menu entry it
/// has to click by its wording, and one wording is testable where a hundred are not.
///
/// Asked for, not guaranteed: both platforms let the account's own language win, and in
/// practice it usually does. The parameter costs nothing where it is ignored and saves the
/// run where it is honoured, which is the whole case for keeping it.
fn target_url(platform: &str, action: &str, user_name: &str) -> Option<String> {
    let user = urlencoding_minimal(user_name);
    let url = match (platform, action) {
        ("x", "showPosts" | "deletePosts") => {
            // Already carries a query, so the language joins it rather than starting a new one.
            format!("https://x.com/search?q=from%3A{user}&src=typed_query&lang=en")
        }
        ("x", "showReplies" | "deleteReplies") => {
            format!("https://x.com/{user}/with_replies?lang=en")
        }
        ("x", "showReposts" | "deleteReposts") => format!("https://x.com/{user}?lang=en"),
        ("x", "showLikes" | "deleteLikes") => format!("https://x.com/{user}/likes?lang=en"),
        ("x", "showFollowing" | "deleteFollowing") => {
            format!("https://x.com/{user}/following?lang=en")
        }
        ("youtube", "showComments" | "deleteComments") => {
            "https://myactivity.google.com/page?page=youtube_comments&hl=en".to_string()
        }
        ("youtube", "showLikes" | "deleteLikes") => {
            "https://www.youtube.com/playlist?list=LL&hl=en".to_string()
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

/// `showLikes` and `deleteLikes` are both about likes. The verb is already in the sentence
/// around it, so repeating it read as "showing showLikes".
fn subject(action: &str) -> String {
    let stem = action
        .strip_prefix("show")
        .or_else(|| action.strip_prefix("delete"))
        .unwrap_or(action);
    let mut chars = stem.chars();
    match chars.next() {
        Some(first) => first.to_lowercase().chain(chars).collect(),
        None => stem.to_string(),
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
    // The action, not the url: the address carries the user's handle, and this line is read
    // by the assistant and can travel into a public bug report.
    crate::bridge::log(
        app,
        "info",
        format!("{platform}: showing {}", subject(action)),
    );
    Ok(json!({ "ok": true }))
}

/// Keeps the page shielded across the wait that follows a navigation.
///
/// The run has already started as far as the user is concerned — the stop button is up and
/// the status bar is counting — but the engine has not been handed the page yet, and until it
/// is, the platform's own list is on screen and takes every click. `eval` cannot be aimed at
/// a document that is still on its way, so the call is repeated rather than timed: the first
/// one to land after the navigation arms the new page, and `run` keeps it armed from there.
///
/// Scoped so the `Webview` is dropped before the next await — one is not `Send`, and holding
/// it across a suspension point makes this whole command un-spawnable.
async fn shield_while_loading(app: &AppHandle, platform: &str, total_ms: u64) {
    const SLICE_MS: u64 = 150;
    let mut elapsed = 0;
    while elapsed < total_ms {
        let slice = SLICE_MS.min(total_ms - elapsed);
        tokio::time::sleep(std::time::Duration::from_millis(slice)).await;
        elapsed += slice;
        {
            if let Some(site) = app.get_webview(crate::site_webview_label(platform)) {
                let _ = site.eval("window.__cmp?.shield(true);");
            }
        }
    }
}

/// Gives the page back when the run never reached the engine that would have done it itself.
fn unshield(app: &AppHandle, platform: &str) {
    if let Some(site) = app.get_webview(crate::site_webview_label(platform)) {
        let _ = site.eval("window.__cmp?.shield(false);");
    }
}

/// A key for a round trip the caller did not name one for.
static PROBE_SEQUENCE: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(0);

/// Hands the page a script and waits for it to answer.
///
/// The same registry and the same oneshot `run_action` uses, deliberately: it is what the
/// stop button reaches into, so anything that answers through a channel of its own would be
/// a run nobody could stop.
async fn await_page(
    app: &AppHandle,
    platform: &str,
    request_id: &str,
    script: String,
) -> Result<u32> {
    let (tx, rx) = oneshot::channel();
    // Scoped so the `State` guard is dropped before the await below: a webview handle is not
    // `Send`, and neither is a mutex guard held across a suspension point.
    {
        let state = app.state::<AppState>();
        state.runs.0.lock().expect("runs mutex").insert(
            request_id.to_owned(),
            Run {
                deleted: 0,
                responder: Some(tx),
            },
        );
    }

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
            .remove(request_id);
        unshield(app, platform);
        return Err(error);
    }

    match rx.await {
        Ok(Ok(count)) => Ok(count),
        Ok(Err(message)) => Err(Error::Message(message)),
        Err(_) => {
            unshield(app, platform);
            Err(Error::Abandoned)
        }
    }
}

/// Runs a plan on the page that is already open.
///
/// No navigation, unlike `run_action`: this is "try what you just got, where you are
/// standing", and a plan is only ever written against a page someone was looking at.
pub async fn run_plan(app: AppHandle, params: &Value) -> Result<Value> {
    let request_id = params
        .get("requestId")
        .and_then(Value::as_str)
        .ok_or(Error::MissingParam("requestId"))?
        .to_owned();
    let platform = params
        .get("platform")
        .and_then(Value::as_str)
        .ok_or(Error::MissingParam("platform"))?;
    let plan = params.get("plan").ok_or(Error::MissingParam("plan"))?;
    let timeouts = params.get("timeouts").cloned().unwrap_or(json!({}));

    let run_params = json!({
        "requestId": request_id,
        "waitAfterDelete": timeouts.get("waitAfterDelete").and_then(Value::as_u64).unwrap_or(500),
        "waitBetweenRetryDeleteAttempts": timeouts
            .get("waitBetweenRetryDeleteAttempts").and_then(Value::as_u64).unwrap_or(500),
        "plan": plan,
    });
    let script = format!(
        "if (window.__cmp) window.__cmp.runPlan({}); \
         else window.chrome.webview.postMessage({{ type: 'error', requestId: {}, \
           message: 'The delete engine is not loaded on this page.' }});",
        json!(run_params.to_string()),
        json!(request_id)
    );

    crate::bridge::log(&app, "info", format!("{platform}: running a plan"));
    let deleted = await_page(&app, platform, &request_id, script).await?;
    crate::bridge::log(
        &app,
        "info",
        format!("{platform}: the plan removed {deleted}"),
    );
    Ok(json!({ "deletedCount": deleted }))
}

/// The page's own account of itself, redacted in the page before it is handed over.
///
/// What comes back is a skeleton — tags, testids, roles, classes, and the short label of a
/// control — with every text node that is not such a label already dropped by the time the
/// host sees it. The redaction is deliberately on the page's side of the wire: nothing that
/// was refused there ever reaches this process, let alone a model.
pub async fn read_structure(app: AppHandle, params: &Value) -> Result<Value> {
    let platform = params
        .get("platform")
        .and_then(Value::as_str)
        .ok_or(Error::MissingParam("platform"))?;

    let request_id = format!(
        "probe-{}",
        PROBE_SEQUENCE.fetch_add(1, std::sync::atomic::Ordering::Relaxed)
    );

    let (tx, rx) = oneshot::channel();
    {
        let state = app.state::<AppState>();
        state
            .probes
            .0
            .lock()
            .expect("probes mutex")
            .insert(request_id.clone(), tx);
    }

    let script = format!(
        "if (window.__cmp) window.__cmp.readStructure({id}); \
         else window.chrome.webview.postMessage({{ type: 'probe', requestId: {id}, \
           error: 'The delete engine is not loaded on this page.' }});",
        id = json!(request_id)
    );

    let evaluated = app
        .get_webview(crate::site_webview_label(platform))
        .ok_or_else(|| Error::Site("site webview is gone".into()))
        .and_then(|site| site.eval(&script).map_err(Error::from));

    if let Err(error) = evaluated {
        app.state::<AppState>()
            .probes
            .0
            .lock()
            .expect("probes mutex")
            .remove(&request_id);
        return Err(error);
    }

    match rx.await {
        Ok(Ok(structure)) => {
            crate::bridge::log(
                &app,
                "info",
                format!(
                    "{platform}: read {} characters of page structure for the assistant",
                    structure.chars().count()
                ),
            );
            Ok(json!({ "structure": structure }))
        }
        Ok(Err(message)) => Err(Error::Message(message)),
        Err(_) => Err(Error::Abandoned),
    }
}

/// How many the plan's target finds, having touched none of them.
pub async fn count_matches(app: AppHandle, params: &Value) -> Result<Value> {
    let platform = params
        .get("platform")
        .and_then(Value::as_str)
        .ok_or(Error::MissingParam("platform"))?;
    let target = params.get("target").ok_or(Error::MissingParam("target"))?;

    // Nobody correlates a count, so nobody had to name it — but the registry is keyed, so it
    // needs a key of its own that cannot collide with a run's.
    let request_id = format!(
        "probe-{}",
        PROBE_SEQUENCE.fetch_add(1, std::sync::atomic::Ordering::Relaxed)
    );
    let script = format!(
        "if (window.__cmp) window.__cmp.countMatches({}, {}); \
         else window.chrome.webview.postMessage({{ type: 'error', requestId: {}, \
           message: 'The delete engine is not loaded on this page.' }});",
        json!(request_id),
        json!(target.to_string()),
        json!(request_id)
    );

    let count = await_page(&app, platform, &request_id, script).await?;
    Ok(json!({ "count": count }))
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
    let wait_after_load = timeouts
        .get("waitAfterDocumentLoad")
        .and_then(Value::as_u64)
        .unwrap_or(3000);

    // A deletion only ever finds anything on the page that lists the thing being deleted, and
    // the user may be looking at any page they clicked through to. Going there first is what
    // separates "nothing to delete" from "not on the right page" — the two used to be the
    // same outcome, with the same empty log.
    // Scoped so the webview handle is dropped before the wait below: a `Webview` is not
    // `Send`, and holding one across an `await` makes the whole command un-spawnable.
    if let Some(url) = target_url(platform, action, &read_user_name(&app)) {
        {
            let site = app
                .get_webview(crate::site_webview_label(platform))
                .ok_or_else(|| Error::Site("site webview is gone".into()))?;
            // Shielded before it leaves, for the case where it does not: an action repeated on
            // the page it already needs navigates nowhere and would otherwise sit there live.
            site.eval(format!(
                "window.__cmp?.shield(true); \
                 if (window.location.href !== {u}) window.location.assign({u});",
                u = json!(url)
            ))?;
        }
        crate::bridge::log(
            &app,
            "info",
            format!("{platform}: opening the {} page", subject(action)),
        );
        // `eval` has no return channel, so the wait is unconditional. It is the same one the
        // settings already expose for a page load, and nothing is lost when the page was
        // already open: it is repainted long before this elapses.
        shield_while_loading(&app, platform, wait_after_load).await;
    }

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
    // The user's own patch runs first, in a try/catch of its own: it is written by hand or by
    // the assistant, and a syntax error in it must cost nothing more than the patch. Applied
    // per run rather than at page load, so saving a fix takes effect on the next action
    // instead of the next navigation.
    let patch = app.state::<AppState>().settings.get().engine_script;
    let patch_script = if patch.trim().is_empty() {
        String::new()
    } else {
        format!(
            "try {{ (function () {{ {patch} }})(); }} \
             catch (e) {{ window.chrome.webview.postMessage({{ type: 'log', level: 'warning', \
               message: 'The engine script from the settings failed: ' + e }}); }}"
        )
    };

    let script = format!(
        "(function () {{ var p = {run_params}; \
           if (window.__cmp) {{ {patch_script} p.userName = window.__cmp.getUserName(); \
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
        // Nothing is running, so nothing will lift this on its own.
        unshield(&app, platform);
        return Err(error);
    }

    // The count belongs in the log, not only in the toast that carries it for five seconds:
    // the log is what the assistant is asked against and what a bug report quotes.
    let what = subject(action);
    match rx.await {
        Ok(Ok(deleted)) => {
            crate::bridge::log(
                &app,
                "info",
                format!("{platform}: {deleted} {what} deleted"),
            );
            Ok(json!({ "deletedCount": deleted }))
        }
        Ok(Err(message)) => {
            crate::bridge::log(
                &app,
                "error",
                format!("{platform}: deleting {what} failed — {message}"),
            );
            Err(Error::Message(message))
        }
        Err(_) => {
            crate::bridge::log(&app, "warning", format!("{platform}: the {what} run ended"));
            unshield(&app, platform);
            Err(Error::Abandoned)
        }
    }
}

/// Cancels by reloading the site webview: the engine has no cancellation primitive, so
/// tearing down the page is what actually stops its click loop.
/// Reloads a platform's page.
///
/// Called when a run ends: these platforms keep rendering the list they were handed, so the
/// rows that were just deleted stay on screen until the page is fetched again. Without this
/// the user is looking at items that no longer exist and cannot tell the run worked.
pub fn reload(app: &AppHandle, params: &Value) -> Result<Value> {
    let platform = params
        .get("platform")
        .and_then(Value::as_str)
        .ok_or(Error::MissingParam("platform"))?;

    if let Some(site) = app.get_webview(crate::site_webview_label(platform)) {
        site.eval("window.location.reload();")?;
    }
    Ok(Value::Null)
}

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

/// Puts a result on the platform page.
///
/// The app's own toasts cannot be seen while a platform is showing: its webview is composited
/// over the window, and the chrome is left with the sidebar column and a 44px strip. The page
/// is the only surface with room, so the message is handed to the engine that lives there.
///
/// Serialised through `serde_json`, not formatted into the script: the text is translated and
/// carries counts and platform names, and a stray quote in it would be a syntax error inside
/// someone's signed-in session.
pub fn toast(app: &AppHandle, params: &Value) -> Result<Value> {
    let platform = params
        .get("platform")
        .and_then(Value::as_str)
        .ok_or(Error::MissingParam("platform"))?;
    let message = params
        .get("message")
        .and_then(Value::as_str)
        .ok_or(Error::MissingParam("message"))?;
    let kind = params.get("kind").and_then(Value::as_str).unwrap_or("info");

    if let Some(site) = app.get_webview(crate::site_webview_label(platform)) {
        let script = format!(
            "window.__cmp && window.__cmp.toast({}, {});",
            serde_json::to_string(message).unwrap_or_else(|_| "\"\"".into()),
            serde_json::to_string(kind).unwrap_or_else(|_| "\"info\"".into())
        );
        let _ = site.eval(&script);
    }
    Ok(Value::Null)
}

pub fn set_site_inset(app: &AppHandle, params: &Value) -> Result<Value> {
    let read = |key: &str, fallback: u32| {
        params
            .get(key)
            .and_then(Value::as_f64)
            .map(|value| value.round().max(0.0) as u32)
            .unwrap_or(fallback)
    };
    crate::set_site_inset(
        app,
        read("left", crate::DEFAULT_CHROME_WIDTH),
        read("top", crate::DEFAULT_HEADER_HEIGHT),
        read("bottom", 0),
    );
    Ok(Value::Null)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn builds_every_x_page() {
        assert_eq!(
            target_url("x", "deletePosts", "someuser").unwrap(),
            "https://x.com/search?q=from%3Asomeuser&src=typed_query&lang=en"
        );
        assert_eq!(
            target_url("x", "showReplies", "someuser").unwrap(),
            "https://x.com/someuser/with_replies?lang=en"
        );
        assert_eq!(
            target_url("x", "deleteReposts", "someuser").unwrap(),
            "https://x.com/someuser?lang=en"
        );
        assert_eq!(
            target_url("x", "deleteLikes", "someuser").unwrap(),
            "https://x.com/someuser/likes?lang=en"
        );
        assert_eq!(
            target_url("x", "showFollowing", "someuser").unwrap(),
            "https://x.com/someuser/following?lang=en"
        );
    }

    /// `show*` and `delete*` land on the same page; deleting happens where the items are
    /// listed, so a divergence here would send a delete run to a page with nothing on it.
    #[test]
    fn the_logged_subject_drops_the_verb() {
        assert_eq!(subject("showLikes"), "likes");
        assert_eq!(subject("deleteFollowing"), "following");
        assert_eq!(subject("whatever"), "whatever");
    }

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
            "https://myactivity.google.com/page?page=youtube_comments&hl=en"
        );
        assert_eq!(
            target_url("youtube", "showLikes", "").unwrap(),
            "https://www.youtube.com/playlist?list=LL&hl=en"
        );
    }

    /// The engine matches the menu entry by its wording, so every page it is sent to has to
    /// come back in the one language that wording is written in.
    #[test]
    fn every_youtube_page_is_asked_for_in_english() {
        for action in ["showComments", "deleteComments", "showLikes", "deleteLikes"] {
            let url = target_url("youtube", action, "").unwrap();
            assert!(
                url.contains("hl=en"),
                "{action} is not pinned to a language: {url}"
            );
        }
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
