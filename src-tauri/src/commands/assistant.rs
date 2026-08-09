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
    let model = current.assistant_model;
    let effort = current.assistant_effort;

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
        assistant::ask(&source, Some(&cli_path), &prompt, &model, &effort)
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

/// The batch file the terminal is pointed at.
///
/// A file rather than a command line, and that is the whole point of it. The command needs
/// two quoted paths and a pipe, and passing that through `Command::arg` cannot work: Rust
/// escapes a quoted argument the way the C runtime expects, as `\"`, and `cmd.exe` has never
/// understood that convention. It takes the backslash literally and goes looking for a
/// program called `\"C:\…\claude.exe\"`, which is exactly the error this fixes. Inside a file
/// there is no argv layer to escape through, so the quoting is cmd's own and means what it
/// says.
fn open_script(prompt: &std::path::Path, binary: &std::path::Path) -> String {
    // The prompt is named, not piped. `claude` without `--print` is an interactive session,
    // and an interactive session handed a redirected stdin drains the pipe and then waits on a
    // handle that will never be a terminal — which is the window that never came back.
    //
    // CRLF because it is read by cmd, and `@echo off` so the window opens on the answer
    // rather than on a copy of the command that produced it.
    format!(
        "@echo off\r\n\"{}\" \"Read {} - it holds a question about CleanMyPosts together with the app log - and answer it.\"\r\n",
        binary.display(),
        prompt.display()
    )
}

/// Opens the prompt in Claude Code, in a terminal window of its own.
///
/// Through a file rather than an argument: the prompt carries the whole log and runs to
/// thousands of characters, which a Windows command line neither fits nor quotes safely — so
/// the command line carries the file's name and Claude Code reads it. The window stays open
/// (`cmd /k`) so the conversation can go on from there, which is the point of handing it over
/// rather than asking from inside the app.
///
/// This is the Claude Code CLI, not the Claude desktop app. Both ship a binary called
/// `claude`, and the desktop one has no interface for being handed a prompt at all — which is
/// why `candidates` names the CLI's own install paths instead of searching for the name.
pub fn open_in_cli(app: &AppHandle, params: &Value) -> Result<Value> {
    let prompt = params
        .get("prompt")
        .and_then(Value::as_str)
        .ok_or(Error::MissingParam("prompt"))?;

    let binary = crate::assistant::cli::locate(Some(&settings(app).assistant_cli_path))
        .ok_or_else(|| Error::Message("Claude Code was not found on this machine".to_owned()))?;

    let path = std::env::temp_dir().join(format!("cleanmyposts-prompt-{}.txt", std::process::id()));
    std::fs::write(&path, prompt).map_err(|error| Error::Message(error.to_string()))?;

    let script = std::env::temp_dir().join(format!("cleanmyposts-open-{}.cmd", std::process::id()));
    std::fs::write(&script, open_script(&path, &binary))
        .map_err(|error| Error::Message(error.to_string()))?;

    // The terminal this opens is the point; the `cmd /c` that opens it is not, and it flashed
    // its own window over the app on the way.
    crate::assistant::cli::hidden(std::process::Command::new("cmd").args([
        "/c",
        "start",
        "",
        "cmd",
        "/k",
        &script.display().to_string(),
    ]))
    .spawn()
    .map_err(|error| Error::Message(format!("could not start a terminal: {error}")))?;

    crate::bridge::log(app, "info", "assistant: handed the request to Claude Code");
    Ok(Value::Null)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::Path;

    /// The bug this stands for, reported from the terminal it opened:
    ///
    /// ```text
    /// '\"C:\Users\thor\.local/bin/claude.exe\"' is not recognized as an internal
    /// or external command, operable program or batch file.
    /// ```
    ///
    /// The backslashes in that message are the finding. They are Rust's argv escaping arriving
    /// intact at a shell that does not speak it, so the program name became the escape sequence
    /// itself. Nothing about the path was wrong — `locate` checks the file exists before this
    /// is ever reached.
    #[test]
    fn the_script_quotes_both_paths_without_escaping_the_quotes() {
        let script = open_script(
            Path::new(r"C:\Users\thor\AppData\Local\Temp\prompt.txt"),
            Path::new(r"C:\Users\thor\.local\bin\claude.exe"),
        );

        assert!(
            !script.contains(r#"\""#),
            "cmd reads a backslash before a quote as two literal characters"
        );
        assert!(script.contains(r"C:\Users\thor\AppData\Local\Temp\prompt.txt"));
        assert!(script.contains(r#""C:\Users\thor\.local\bin\claude.exe""#));
    }

    /// A path with a space in it is the ordinary case on Windows, not the exotic one. The
    /// binary carries its own quotes; the prompt's path rides inside the opening sentence,
    /// which is quoted as a whole — so the spaces are somebody's, either way.
    #[test]
    fn a_path_with_a_space_stays_inside_its_quotes() {
        let script = open_script(
            Path::new(r"C:\Users\Anna Meier\AppData\Local\Temp\prompt.txt"),
            Path::new(r"C:\Program Files\claude\claude.exe"),
        );

        assert!(script.contains(r#""C:\Program Files\claude\claude.exe""#));
        let sentence = script.split('"').nth(3).unwrap();
        assert!(sentence.contains(r"C:\Users\Anna Meier\AppData\Local\Temp\prompt.txt"));
    }

    /// Read by cmd, which wants CRLF, and opens on the answer rather than on the command.
    #[test]
    fn it_is_a_batch_file_cmd_will_read() {
        let script = open_script(Path::new("a.txt"), Path::new("b.exe"));

        assert!(script.starts_with("@echo off\r\n"));
        assert!(script.ends_with("\r\n"));
    }

    /// The bug this stands for: the window opened, said nothing and never came back.
    ///
    /// `type prompt.txt | claude.exe` starts an interactive session — `--print` is what makes
    /// it answer once and stop — and an interactive session whose stdin is a pipe drains it
    /// and then waits forever on a handle that will never be a terminal. Naming the file on
    /// the command line instead leaves stdin on the keyboard, where the rest of the
    /// conversation has to come from.
    #[test]
    fn it_does_not_pipe_the_prompt_into_an_interactive_session() {
        let script = open_script(Path::new("prompt.txt"), Path::new("claude.exe"));

        assert!(
            !script.contains('|'),
            "a pipe leaves stdin as something nobody can type into"
        );
        assert!(!script.contains("type "));
        assert!(script.contains("prompt.txt"));
    }
}
