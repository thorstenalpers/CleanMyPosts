use crate::bridge::{log, push_event};
use crate::error::{Error, Result};
use crate::state::AppState;
use serde_json::{json, Value};
use tauri::{AppHandle, Manager};

pub const HOMEPAGE_URL: &str = "https://github.com/thorstenalpers/CleanMyPosts";
pub const REPORT_BUG_URL: &str = "https://github.com/thorstenalpers/CleanMyPosts/issues";
/// The anchor GitHub generates for the README's "🩺 Troubleshooting" heading.
pub const TROUBLESHOOTING_URL: &str =
    "https://github.com/thorstenalpers/CleanMyPosts#-troubleshooting";

pub fn get_info() -> Result<Value> {
    Ok(json!({
        "version": env!("CARGO_PKG_VERSION"),
        "homepageUrl": HOMEPAGE_URL,
        "reportBugUrl": REPORT_BUG_URL,
        "troubleshootingUrl": TROUBLESHOOTING_URL,
    }))
}

pub fn open_url(params: &Value) -> Result<Value> {
    let url = params.get("url").and_then(Value::as_str).unwrap_or("");
    tauri_plugin_opener::open_url(url, None::<&str>).map_err(|e| Error::Message(e.to_string()))?;
    Ok(Value::Null)
}

pub fn open_license(app: &AppHandle) -> Result<Value> {
    let path = app
        .path()
        .resource_dir()
        .map_err(|e| Error::Message(e.to_string()))?
        .join("THIRD_PARTY_LICENSES.txt");
    tauri_plugin_opener::open_path(path.to_string_lossy().to_string(), None::<&str>)
        .map_err(|e| Error::Message(e.to_string()))?;
    Ok(Value::Null)
}

pub fn get_log_buffer(app: &AppHandle) -> Result<Value> {
    let entries = app.state::<AppState>().logs.snapshot();
    Ok(serde_json::to_value(entries)?)
}

/// Only reports what is on offer. Nothing is downloaded until the UI has shown the version
/// and the user has agreed to it, because installing ends with the app restarting.
pub async fn check_for_updates(app: &AppHandle) -> Result<Value> {
    use tauri_plugin_updater::UpdaterExt;

    let update = app
        .updater()
        .map_err(|e| Error::Message(e.to_string()))?
        .check()
        .await
        .map_err(|e| Error::Message(e.to_string()))?;

    let result = match &update {
        Some(update) => json!({ "updateAvailable": true, "version": update.version }),
        None => json!({ "updateAvailable": false }),
    };
    *app.state::<AppState>()
        .pending_update
        .lock()
        .expect("pending update mutex") = update;

    Ok(result)
}

/// Never returns on success: `app.restart()` replaces the process once the installer has run,
/// so the call the UI is awaiting dies with it.
pub async fn install_update(app: &AppHandle) -> Result<Value> {
    let update = app
        .state::<AppState>()
        .pending_update
        .lock()
        .expect("pending update mutex")
        .take()
        .ok_or_else(|| Error::Message("No update is waiting to be installed.".into()))?;

    log(
        app,
        "info",
        format!("Installing update {}…", update.version),
    );

    let handle = app.clone();
    let mut downloaded = 0u64;
    let mut last_step = u64::MAX;
    update
        .download_and_install(
            move |chunk, content_length| {
                downloaded += chunk as u64;
                // A chunk is tens of kilobytes, so an installer is thousands of them. The bar
                // has a hundred steps, and an unmeasured download only counts megabytes;
                // anything finer is traffic the UI throws away.
                let step = match content_length {
                    Some(total) if total > 0 => downloaded * 100 / total,
                    _ => downloaded / 1_048_576,
                };
                if step != last_step {
                    last_step = step;
                    push_event(
                        &handle,
                        "updateProgress",
                        json!({ "downloaded": downloaded, "contentLength": content_length }),
                    );
                }
            },
            || {},
        )
        .await
        .map_err(|e| Error::Message(e.to_string()))?;

    app.restart();
}
