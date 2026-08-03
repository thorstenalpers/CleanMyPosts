use crate::assistant;
use crate::error::{Error, Result};
use crate::state::AppState;
use serde_json::{json, Value};
use tauri::{AppHandle, Manager};

fn settings(app: &AppHandle) -> crate::settings::AppSettings {
    app.state::<AppState>().settings.get()
}

/// The picker's rows plus whether the local CLI is there, in one call: the settings dialog
/// needs both at once and two round-trips would let it paint half-decided.
pub fn get_sources(app: &AppHandle) -> Result<Value> {
    let configured = settings(app).assistant_cli_path;
    Ok(json!({
        "local": assistant::cli::status(Some(&configured)),
        "providers": assistant::providers::catalogue(),
    }))
}

pub fn set_key(params: &Value) -> Result<Value> {
    let provider = params
        .get("provider")
        .and_then(Value::as_str)
        .ok_or(Error::MissingParam("provider"))?;
    let key = params.get("key").and_then(Value::as_str).unwrap_or("");

    assistant::secrets::set(provider, key)?;
    Ok(Value::Null)
}

pub fn open_free_key_url(params: &Value) -> Result<Value> {
    let provider = params
        .get("provider")
        .and_then(Value::as_str)
        .ok_or(Error::MissingParam("provider"))?;

    assistant::providers::open_free_key_url(provider)?;
    Ok(Value::Null)
}

/// Blocking work — the HTTP call and the subprocess both wait — so it runs off the main
/// thread rather than freezing the window for as long as the model takes to answer.
pub async fn ask(app: AppHandle, params: &Value) -> Result<Value> {
    let prompt = params
        .get("prompt")
        .and_then(Value::as_str)
        .ok_or(Error::MissingParam("prompt"))?
        .to_owned();

    let current = settings(&app);
    let source = current.assistant_source;
    let cli_path = current.assistant_cli_path;

    let text = tauri::async_runtime::spawn_blocking(move || {
        assistant::ask(&source, Some(&cli_path), &prompt)
    })
    .await
    .map_err(|error| Error::Message(error.to_string()))??;

    Ok(json!({ "text": text }))
}
