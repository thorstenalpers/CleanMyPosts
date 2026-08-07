use crate::bridge::push_event;
use crate::error::{Error, Result};
use crate::settings::AppSettings;
use crate::state::AppState;
use serde_json::Value;
use tauri::{AppHandle, Manager};

pub fn get(app: &AppHandle) -> Result<Value> {
    let settings = app.state::<AppState>().settings.get();
    Ok(serde_json::to_value(settings)?)
}

pub fn set(app: &AppHandle, params: Value) -> Result<Value> {
    let next: AppSettings = serde_json::from_value(params)?;
    app.state::<AppState>()
        .settings
        .set(next.clone())
        .map_err(Error::Message)?;
    // The pages already loaded have their own copy of the engine's configuration, and the
    // consent watcher is polling right now — so the switch is pushed across rather than
    // waiting for the next navigation.
    for platform in ["x", "youtube"] {
        if let Some(site) = app.get_webview(crate::site_webview_label(platform)) {
            let _ = site.eval(format!(
                "window.__cmp && (window.__cmp.config.autoConsent = {});",
                next.auto_consent
            ));
        }
    }

    push_event(app, "settingsChanged", serde_json::to_value(&next)?);
    Ok(Value::Null)
}

/// Every setting back to what a fresh install has.
///
/// Routed through `set` so a reset is not a second path that can forget a step: it persists,
/// pushes the switch to the loaded pages, and announces the change exactly as any other
/// change does.
pub fn reset(app: &AppHandle) -> Result<Value> {
    let defaults = AppSettings::default();
    set(app, serde_json::to_value(&defaults)?)?;
    Ok(serde_json::to_value(&defaults)?)
}
