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

    // What left the machine, in the log that stays on it. The prompt itself only under
    // verbose logging: it carries the whole log again, and one copy of that is enough for
    // an ordinary session.
    crate::bridge::log(
        &app,
        "info",
        format!(
            "assistant: sending {} characters to {source}",
            prompt.chars().count()
        ),
    );
    crate::bridge::log(
        &app,
        "debug",
        format!(
            "assistant: the request was
{prompt}"
        ),
    );

    let text = tauri::async_runtime::spawn_blocking(move || {
        assistant::ask(&source, Some(&cli_path), &prompt)
    })
    .await
    .map_err(|error| Error::Message(error.to_string()))??;

    crate::bridge::log(
        &app,
        "info",
        format!(
            "assistant: answered with {} characters",
            text.chars().count()
        ),
    );

    Ok(json!({ "text": text }))
}

/// Opens the prompt in Claude Code, in a terminal window of its own.
///
/// Through a file rather than an argument: the prompt carries the whole log and runs to
/// thousands of characters, which a Windows command line neither fits nor quotes safely.
/// The window stays open (`cmd /k`) so the conversation can go on from there — which is the
/// point of handing it over rather than asking from inside the app.
pub fn open_in_cli(app: &AppHandle, params: &Value) -> Result<Value> {
    let prompt = params
        .get("prompt")
        .and_then(Value::as_str)
        .ok_or(Error::MissingParam("prompt"))?;

    let binary = crate::assistant::cli::locate(Some(&settings(app).assistant_cli_path))
        .ok_or_else(|| Error::Message("Claude Code was not found on this machine".to_owned()))?;

    let path = std::env::temp_dir().join(format!("cleanmyposts-prompt-{}.txt", std::process::id()));
    std::fs::write(&path, prompt).map_err(|error| Error::Message(error.to_string()))?;

    std::process::Command::new("cmd")
        .args([
            "/c",
            "start",
            "",
            "cmd",
            "/k",
            &format!("type \"{}\" | \"{}\"", path.display(), binary.display()),
        ])
        .spawn()
        .map_err(|error| Error::Message(format!("could not start a terminal: {error}")))?;

    crate::bridge::log(app, "info", "assistant: handed the request to Claude Code");
    Ok(Value::Null)
}
