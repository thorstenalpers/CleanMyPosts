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
    push_event(app, "settingsChanged", serde_json::to_value(&next)?);
    Ok(Value::Null)
}
