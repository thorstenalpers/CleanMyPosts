use crate::log::{LogBuffer, LogEntry};
use crate::settings::{AppSettings, SettingsStore};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager};
use tokio::sync::oneshot;

pub const HOMEPAGE_URL: &str = "https://github.com/thorstenalpers/CleanMyPosts";
pub const REPORT_BUG_URL: &str = "https://github.com/thorstenalpers/CleanMyPosts/issues";

/// One in-flight `site.runAction`. `deleted` is kept up to date from progress messages so
/// a cancel can still resolve the call with the count achieved so far, matching the
/// contract's promise that cancelling resolves rather than rejects.
struct Run {
    deleted: u32,
    responder: Option<oneshot::Sender<Result<u32, String>>>,
}

#[derive(Default)]
pub struct Runs(Mutex<HashMap<String, Run>>);

/// What the site webview last told us about itself. `eval` has no return channel, so the
/// injected script reports this instead of the host asking for it.
#[derive(Default)]
pub struct SiteInfo {
    pub user_name: String,
}

pub struct AppState {
    pub settings: SettingsStore,
    pub logs: LogBuffer,
    pub runs: Runs,
    pub site: Mutex<SiteInfo>,
}

fn now_rfc3339() -> String {
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default();
    // Deliberately not pulling in `chrono` for one timestamp: the UI only ever parses
    // this back with `new Date(...)`, and epoch-millis-to-RFC3339 is a fixed conversion.
    let secs = now.as_secs() as i64;
    let millis = now.subsec_millis();
    let days = secs.div_euclid(86_400);
    let tod = secs.rem_euclid(86_400);
    let (y, m, d) = civil_from_days(days);
    format!(
        "{y:04}-{m:02}-{d:02}T{:02}:{:02}:{:02}.{millis:03}Z",
        tod / 3600,
        (tod % 3600) / 60,
        tod % 60
    )
}

/// Howard Hinnant's civil-from-days algorithm.
fn civil_from_days(z: i64) -> (i64, u32, u32) {
    let z = z + 719_468;
    let era = z.div_euclid(146_097);
    let doe = z.rem_euclid(146_097);
    let yoe = (doe - doe / 1460 + doe / 36_524 - doe / 146_096) / 365;
    let y = yoe + era * 400;
    let doy = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp = (5 * doy + 2) / 153;
    let d = (doy - (153 * mp + 2) / 5 + 1) as u32;
    let m = if mp < 10 { mp + 3 } else { mp - 9 } as u32;
    (if m <= 2 { y + 1 } else { y }, m, d)
}

pub fn push_event(app: &AppHandle, event: &str, payload: Value) {
    let _ = app.emit_to(
        "chrome",
        "cmp-push",
        json!({ "event": event, "payload": payload }),
    );
}

pub fn log(app: &AppHandle, level: &str, message: impl Into<String>) {
    let entry = LogEntry {
        timestamp: now_rfc3339(),
        level: level.into(),
        message: message.into(),
    };
    if let Some(state) = app.try_state::<AppState>() {
        state.logs.push(entry.clone());
    }
    push_event(
        app,
        "log",
        serde_json::to_value(entry).unwrap_or(Value::Null),
    );
}

/// Mirrors `SiteActionOrchestrator.BuildUrl` on the C# side. `show*` and `delete*` share a
/// target because deleting always happens on the page that lists the items.
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

/// Routes one content-script message. Returns nothing: the engine is fire-and-forget and
/// every outcome it reports is either a push event or the resolution of a pending run.
pub fn handle_content_message(app: &AppHandle, message: &Value) {
    let kind = message.get("type").and_then(Value::as_str).unwrap_or("");
    let request_id = message
        .get("requestId")
        .and_then(Value::as_str)
        .unwrap_or("")
        .to_string();

    match kind {
        "siteInfo" => {
            let user = message
                .get("userName")
                .and_then(Value::as_str)
                .unwrap_or("")
                .to_string();
            let logged_in = message
                .get("loginStatus")
                .and_then(Value::as_str)
                .is_some_and(|s| s == "logged_in")
                || !user.is_empty();
            let platform = match message.get("host").and_then(Value::as_str) {
                Some(h) if h.contains("x.com") => "x",
                Some(_) => "youtube",
                None => return,
            };

            if let Some(state) = app.try_state::<AppState>() {
                if !user.is_empty() {
                    state.site.lock().expect("site mutex").user_name = user;
                }
            }
            push_event(
                app,
                "siteLogin",
                json!({ "platform": platform, "loggedIn": logged_in }),
            );
        }
        "log" => {
            let level = message
                .get("level")
                .and_then(Value::as_str)
                .unwrap_or("info");
            let text = message.get("message").and_then(Value::as_str).unwrap_or("");
            log(app, level, text);
        }
        "progress" => {
            let count = message
                .get("deletedCount")
                .and_then(Value::as_u64)
                .unwrap_or(0) as u32;
            if let Some(state) = app.try_state::<AppState>() {
                if let Some(run) = state
                    .runs
                    .0
                    .lock()
                    .expect("runs mutex")
                    .get_mut(&request_id)
                {
                    run.deleted = count;
                }
            }
            push_event(
                app,
                "progress",
                json!({ "requestId": request_id, "deletedCount": count }),
            );
        }
        "done" | "error" => {
            let Some(state) = app.try_state::<AppState>() else {
                return;
            };
            let mut runs = state.runs.0.lock().expect("runs mutex");
            if let Some(run) = runs.get_mut(&request_id) {
                if let Some(responder) = run.responder.take() {
                    let outcome = if kind == "done" {
                        Ok(message
                            .get("deletedCount")
                            .and_then(Value::as_u64)
                            .unwrap_or(run.deleted as u64) as u32)
                    } else {
                        Err(message
                            .get("message")
                            .and_then(Value::as_str)
                            .unwrap_or("Deletion failed.")
                            .to_string())
                    };
                    let _ = responder.send(outcome);
                }
                runs.remove(&request_id);
            }
        }
        _ => {}
    }
}

async fn eval_in_site(app: &AppHandle, script: String) -> Result<(), String> {
    app.get_webview("site")
        .ok_or_else(|| "site webview is gone".to_string())?
        .eval(&script)
        .map_err(|e| e.to_string())
}

async fn run_action(app: AppHandle, params: &Value) -> Result<Value, String> {
    let request_id = params
        .get("requestId")
        .and_then(Value::as_str)
        .ok_or("requestId missing")?
        .to_string();
    let platform = params
        .get("platform")
        .and_then(Value::as_str)
        .ok_or("platform missing")?;
    let action = params
        .get("action")
        .and_then(Value::as_str)
        .ok_or("action missing")?;
    let engine = engine_action(action).ok_or_else(|| format!("{action} is not a delete action"))?;

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

    if let Err(error) = eval_in_site(&app, script).await {
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
        Ok(Err(message)) => Err(message),
        Err(_) => Err("The run ended without reporting a result.".into()),
    }
}

/// Cancels by reloading the site webview: the engine has no cancellation primitive, so
/// tearing down the page is what actually stops its click loop.
fn cancel_action(app: &AppHandle, params: &Value) -> Result<Value, String> {
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

    if let Some(site) = app.get_webview("site") {
        let _ = site.eval("window.location.reload();");
    }
    Ok(Value::Null)
}

/// Installs and restarts on its own rather than reporting back and waiting: the contract's
/// result only carries "is there one", and AutoUpdater.NET likewise owned the whole flow
/// once the user asked. `app.restart()` never returns.
async fn check_for_updates(app: &AppHandle) -> Result<Value, String> {
    use tauri_plugin_updater::UpdaterExt;

    let update = app
        .updater()
        .map_err(|e| e.to_string())?
        .check()
        .await
        .map_err(|e| e.to_string())?;

    let Some(update) = update else {
        return Ok(
            json!({ "updateAvailable": false, "message": "You are on the latest version." }),
        );
    };

    log(
        app,
        "info",
        format!("Installing update {}…", update.version),
    );
    update
        .download_and_install(|_, _| {}, || {})
        .await
        .map_err(|e| e.to_string())?;

    app.restart();
}

pub async fn dispatch(app: AppHandle, method: String, params: Value) -> Result<Value, String> {
    match method.as_str() {
        "app.getInfo" => Ok(json!({
            "version": env!("CARGO_PKG_VERSION"),
            "homepageUrl": HOMEPAGE_URL,
            "reportBugUrl": REPORT_BUG_URL,
        })),

        "settings.get" => {
            let settings = app.state::<AppState>().settings.get();
            serde_json::to_value(settings).map_err(|e| e.to_string())
        }

        "settings.set" => {
            let next: AppSettings = serde_json::from_value(params).map_err(|e| e.to_string())?;
            app.state::<AppState>().settings.set(next.clone())?;
            push_event(
                &app,
                "settingsChanged",
                serde_json::to_value(&next).map_err(|e| e.to_string())?,
            );
            Ok(Value::Null)
        }

        "site.navigate" => {
            let platform = params
                .get("platform")
                .and_then(Value::as_str)
                .ok_or("platform missing")?;
            let action = params
                .get("action")
                .and_then(Value::as_str)
                .ok_or("action missing")?;

            let user = read_user_name(&app);
            let url = target_url(platform, action, &user)
                .ok_or_else(|| format!("no page for {platform}:{action}"))?;

            let site = app.get_webview("site").ok_or("site webview is gone")?;
            site.eval(format!("window.location.assign({});", json!(url)))
                .map_err(|e| e.to_string())?;
            Ok(json!({ "ok": true }))
        }

        "site.runAction" => run_action(app, &params).await,
        "site.cancelAction" => cancel_action(&app, &params),

        "site.hide" => {
            let hide = params.get("hide").and_then(Value::as_bool).unwrap_or(false);
            crate::set_site_hidden(&app, hide);
            Ok(Value::Null)
        }

        "site.reload" => {
            if let Some(site) = app.get_webview("site") {
                site.eval("window.location.reload();")
                    .map_err(|e| e.to_string())?;
            }
            Ok(Value::Null)
        }

        "layout.setSidebarExpanded" => {
            let expanded = params
                .get("expanded")
                .and_then(Value::as_bool)
                .unwrap_or(true);
            crate::set_sidebar_expanded(&app, expanded);
            Ok(Value::Null)
        }

        "updater.checkForUpdates" => check_for_updates(&app).await,

        "system.openUrl" => {
            let url = params.get("url").and_then(Value::as_str).unwrap_or("");
            tauri_plugin_opener::open_url(url, None::<&str>).map_err(|e| e.to_string())?;
            Ok(Value::Null)
        }

        "system.openLicense" => {
            let path = app
                .path()
                .resource_dir()
                .map_err(|e| e.to_string())?
                .join("THIRD_PARTY_LICENSES.txt");
            tauri_plugin_opener::open_path(path.to_string_lossy().to_string(), None::<&str>)
                .map_err(|e| e.to_string())?;
            Ok(Value::Null)
        }

        "log.getBuffer" => {
            let entries = app.state::<AppState>().logs.snapshot();
            serde_json::to_value(entries).map_err(|e| e.to_string())
        }

        other => Err(format!("unknown bridge method \"{other}\"")),
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

    #[test]
    fn converts_days_since_epoch_to_a_civil_date() {
        assert_eq!(civil_from_days(0), (1970, 1, 1));
        assert_eq!(civil_from_days(11_323), (2001, 1, 1));
        assert_eq!(civil_from_days(19_358), (2023, 1, 1));
    }

    /// The UI parses this with `z.iso.datetime({ offset: true })`.
    #[test]
    fn timestamp_is_rfc3339_with_a_zulu_offset() {
        let stamp = now_rfc3339();

        assert_eq!(stamp.len(), 24, "unexpected shape: {stamp}");
        assert!(stamp.ends_with('Z'), "no offset: {stamp}");
        assert_eq!(&stamp[4..5], "-");
        assert_eq!(&stamp[10..11], "T");
    }
}
