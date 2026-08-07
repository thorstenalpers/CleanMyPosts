use crate::bridge::log;
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

/// Installs and restarts on its own rather than reporting back and waiting: the contract's
/// result only carries "is there one". `app.restart()` never returns.
pub async fn check_for_updates(app: &AppHandle) -> Result<Value> {
    use tauri_plugin_updater::UpdaterExt;

    let update = app
        .updater()
        .map_err(|e| Error::Message(e.to_string()))?
        .check()
        .await
        .map_err(|e| Error::Message(e.to_string()))?;

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
        .map_err(|e| Error::Message(e.to_string()))?;

    app.restart();
}
