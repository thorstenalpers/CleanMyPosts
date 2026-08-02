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
