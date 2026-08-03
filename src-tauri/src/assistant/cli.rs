//! Asking the Claude Code binary already on this machine, which is the one source that
//! needs no key and sends nothing from this app.
//!
//! Driven as a plain subprocess rather than through the Agent SDK: `claude --print` answers
//! once on stdout and stops, which is exactly the shape a button needs. Whether that binary
//! reaches the network is Claude Code's business, under the user's own account.

use crate::error::{Error, Result};
use std::path::{Path, PathBuf};
use std::process::Command;

/// Where Claude Code installs itself, in the order worth trying.
fn candidates() -> Vec<PathBuf> {
    let mut paths = Vec::new();
    if let Some(home) = dirs::home_dir() {
        paths.push(home.join(".local/bin/claude.exe"));
        paths.push(home.join(".local/bin/claude"));
        paths.push(home.join("AppData/Roaming/npm/claude.cmd"));
    }
    paths
}

/// The configured binary, or the first one that exists in a known place.
pub fn locate(configured: Option<&str>) -> Option<PathBuf> {
    if let Some(path) = configured.filter(|value| !value.trim().is_empty()) {
        let path = PathBuf::from(path.trim());
        return path.is_file().then_some(path);
    }
    candidates().into_iter().find(|path| path.is_file())
}

/// What the window shows next to the "use the local CLI" choice.
pub fn status(configured: Option<&str>) -> serde_json::Value {
    let path = locate(configured);
    serde_json::json!({
        "found": path.is_some(),
        "version": path.as_deref().and_then(version_of),
        "path": path.map(|value| value.to_string_lossy().into_owned()),
    })
}

/// The version string the binary reports, or none when it will not say.
///
/// Asked of the binary the user configured rather than of whatever `claude` happens to be on
/// PATH — those are not always the same install.
fn version_of(binary: &Path) -> Option<String> {
    let output = Command::new(binary).arg("--version").output().ok()?;
    if !output.status.success() {
        return None;
    }
    String::from_utf8_lossy(&output.stdout)
        .lines()
        .next()
        .map(str::trim)
        .filter(|line| !line.is_empty())
        .map(str::to_owned)
}

/// Runs one prompt through the CLI and returns what it answered.
///
/// The prompt goes on stdin rather than in an argument: it carries the log and the user's
/// own sentence, and a command line has both a length limit and a quoting problem.
pub fn ask(configured: Option<&str>, prompt: &str) -> Result<String> {
    use std::io::Write;

    let binary = locate(configured)
        .ok_or_else(|| Error::Message("Claude Code was not found on this machine".to_owned()))?;

    let mut child = Command::new(&binary)
        .args(["--print", "--output-format", "text"])
        .stdin(std::process::Stdio::piped())
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .spawn()
        .map_err(|error| Error::Message(format!("Claude Code would not start: {error}")))?;

    child
        .stdin
        .take()
        .ok_or_else(|| Error::Message("Claude Code took no input".to_owned()))?
        .write_all(prompt.as_bytes())
        .map_err(|error| Error::Message(error.to_string()))?;

    let output = child
        .wait_with_output()
        .map_err(|error| Error::Message(error.to_string()))?;

    if !output.status.success() {
        let reason = String::from_utf8_lossy(&output.stderr);
        let reason = reason.trim();
        return Err(Error::Message(if reason.is_empty() {
            "Claude Code reported an error".to_owned()
        } else {
            reason.to_owned()
        }));
    }

    let text = String::from_utf8_lossy(&output.stdout).trim().to_owned();
    if text.is_empty() {
        return Err(Error::Message("Claude Code returned no answer".to_owned()));
    }
    Ok(text)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_configured_path_that_is_not_a_file_counts_as_missing() {
        assert!(locate(Some("C:/nowhere/claude.exe")).is_none());
        let status = status(Some("C:/nowhere/claude.exe"));
        assert_eq!(status["found"], false);
        assert!(status["path"].is_null());
    }

    #[test]
    fn a_missing_binary_is_reported_rather_than_spawned() {
        assert!(ask(Some("C:/nowhere/claude.exe"), "question").is_err());
    }

    #[test]
    fn a_blank_configuration_falls_back_to_the_known_places() {
        // Only that the blank is ignored; whether a CLI is installed is the developer's
        // business, not this test's.
        let _ = locate(Some("   "));
    }
}
