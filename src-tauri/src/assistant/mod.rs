//! Where an answer comes from.
//!
//! Two kinds of source: the Claude Code binary already on this machine, which needs no key
//! and no network from this app, and a hosted model, which needs both. The choice is the
//! user's and it is explicit, because it decides whether anything leaves this machine at all.

pub mod cli;
pub mod providers;
pub mod secrets;

use crate::error::{Error, Result};

/// The id the local CLI answers to, alongside the hosted providers.
pub const LOCAL: &str = "claude-code";

/// Routes one question to the chosen source.
///
/// `model` and `effort` are the user's settings and mean nothing to the local CLI: Claude Code
/// picks its own model and answers at whatever length the task needs, so they are only carried
/// as far as a hosted provider.
pub fn ask(
    source: &str,
    cli_path: Option<&str>,
    prompt: &str,
    model: &str,
    effort: &str,
) -> Result<String> {
    if prompt.trim().is_empty() {
        return Err(Error::Message("the prompt is empty".to_owned()));
    }

    if source == LOCAL {
        return cli::ask(cli_path, prompt);
    }

    let provider = providers::find(source)
        .ok_or_else(|| Error::Message(format!("unknown source '{source}'")))?;
    let key = secrets::get(source)?
        .ok_or_else(|| Error::Message(format!("no API key set for {source}")))?;

    providers::ask(provider, &key, prompt, model, effort)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn an_empty_prompt_never_reaches_a_source() {
        assert!(ask(LOCAL, None, "   ", "", "medium").is_err());
        assert!(ask("openai", None, "", "", "medium").is_err());
    }

    #[test]
    fn an_unknown_source_is_refused() {
        assert!(ask("telepathy", None, "question", "", "medium").is_err());
    }
}
