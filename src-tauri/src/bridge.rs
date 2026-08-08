use crate::log::{now_rfc3339, LogEntry};
use crate::state::AppState;
use serde_json::{json, Value};
use tauri::{AppHandle, Emitter, Manager};

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
        let settings = state.settings.get();
        // Enforced here rather than in the view: a debug line nobody asked for must not
        // exist at all, and a buffer the UI merely refuses to draw would still be a record
        // of the run.
        if entry.level == "debug" && !settings.debug_logging {
            return;
        }
        state.logs.push(entry.clone());
    }
    push_event(
        app,
        "log",
        serde_json::to_value(entry).unwrap_or(Value::Null),
    );
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
            let status = message
                .get("loginStatus")
                .and_then(Value::as_str)
                .unwrap_or_default()
                .to_string();
            let platform = match message.get("host").and_then(Value::as_str) {
                Some(h) if h.contains("x.com") => "x",
                Some(_) => "youtube",
                None => return,
            };

            let mut changed = true;
            let mut logged_in = status == "logged_in" || !user.is_empty();
            if let Some(state) = app.try_state::<AppState>() {
                let mut site = state.site.lock().expect("site mutex");
                if !user.is_empty() {
                    site.user_name = user.clone();
                }
                // "unknown" is the page saying it cannot tell — a half-rendered document, or
                // one of the other pages a platform spreads its account over. Treating that as
                // a sign-out disabled the panel the moment a user opened their comments.
                if !logged_in && status == "unknown" {
                    logged_in = site.logged_in.get(platform).copied().unwrap_or(false);
                }
                changed = site.logged_in.insert(platform.into(), logged_in) != Some(logged_in);
            }
            // Once per change, and never for "unknown". A page that cannot tell yet is the
            // normal first second of a load, and reporting it wrote a line saying nobody was
            // signed in immediately before the line saying somebody was.
            if changed && status != "unknown" {
                // The handle stays out of it. This log is what the assistant is asked against
                // and what a bug report carries to a public issue, and the app promises it
                // holds no post content, no handle and nothing else that names a person.
                let text = if logged_in {
                    format!("{platform}: signed in")
                } else {
                    format!("{platform}: no signed-in account found (page reports \"{status}\")")
                };
                log(app, "info", text);
            }
            push_event(
                app,
                "siteLogin",
                json!({
                    "platform": platform,
                    "loggedIn": logged_in,
                    "url": message.get("url").and_then(Value::as_str).unwrap_or_default(),
                }),
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
        // Text back from the page, not a count: the redacted page structure the assistant is
        // shown. Its own registry, so a probe can never be mistaken for a run.
        "probe" => {
            let Some(state) = app.try_state::<AppState>() else {
                return;
            };
            // Taken out first so the guard is dropped before the send below, rather than held
            // across it inside an `if let` scrutinee.
            let responder = state
                .probes
                .0
                .lock()
                .expect("probes mutex")
                .remove(&request_id);
            if let Some(responder) = responder {
                let outcome = match message.get("error").and_then(Value::as_str) {
                    Some(error) => Err(error.to_owned()),
                    None => Ok(message
                        .get("payload")
                        .and_then(Value::as_str)
                        .unwrap_or_default()
                        .to_owned()),
                };
                let _ = responder.send(outcome);
            }
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
