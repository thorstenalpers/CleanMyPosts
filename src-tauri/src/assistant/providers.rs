//! The hosted models the assistant can ask, and the one shape they share.
//!
//! Three of the five speak OpenAI's dialect, so they differ only in host, model and the
//! header the key rides in. Gemini and Anthropic each want their own body, which is why the
//! request is built per family rather than per provider.

use crate::error::{Error, Result};
use std::time::Duration;

const TIMEOUT: Duration = Duration::from_secs(120);

/// How a provider wants to be spoken to.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum Dialect {
    /// `POST /chat/completions` with a bearer token — OpenAI and its imitators.
    OpenAi,
    Gemini,
    Anthropic,
}

#[derive(Debug, Clone, Copy)]
pub struct Provider {
    pub id: &'static str,
    pub label: &'static str,
    dialect: Dialect,
    endpoint: &'static str,
    pub model: &'static str,
    /// Where a free key can be had, for providers that give one away.
    pub free_key_url: Option<&'static str>,
}

/// The providers offered, in the order the picker shows them. The two that hand out a free
/// key come first, because for most people that is the whole decision.
pub const PROVIDERS: &[Provider] = &[
    Provider {
        id: "gemini",
        label: "Google AI",
        dialect: Dialect::Gemini,
        endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
        model: "gemini-2.0-flash",
        free_key_url: Some("https://aistudio.google.com/api-keys"),
    },
    Provider {
        id: "groq",
        label: "Groq",
        dialect: Dialect::OpenAi,
        endpoint: "https://api.groq.com/openai/v1/chat/completions",
        model: "llama-3.3-70b-versatile",
        free_key_url: Some("https://console.groq.com/keys"),
    },
    Provider {
        id: "openai",
        label: "OpenAI",
        dialect: Dialect::OpenAi,
        endpoint: "https://api.openai.com/v1/chat/completions",
        model: "gpt-4o-mini",
        free_key_url: None,
    },
    Provider {
        id: "anthropic",
        label: "Anthropic",
        dialect: Dialect::Anthropic,
        endpoint: "https://api.anthropic.com/v1/messages",
        model: "claude-sonnet-4-5",
        free_key_url: None,
    },
    Provider {
        id: "mistral",
        label: "Mistral",
        dialect: Dialect::OpenAi,
        endpoint: "https://api.mistral.ai/v1/chat/completions",
        model: "mistral-small-latest",
        free_key_url: None,
    },
];

pub fn find(id: &str) -> Option<&'static Provider> {
    PROVIDERS.iter().find(|provider| provider.id == id)
}

/// The picker's rows: what a provider is called, what it answers with, whether a key is
/// already stored for it, and where a free one can be had. Never the key itself.
pub fn catalogue() -> serde_json::Value {
    let rows: Vec<serde_json::Value> = PROVIDERS
        .iter()
        .map(|provider| {
            serde_json::json!({
                "id": provider.id,
                "label": provider.label,
                "model": provider.model,
                "freeKeyUrl": provider.free_key_url,
                "hasKey": super::secrets::has(provider.id),
            })
        })
        .collect();
    serde_json::Value::Array(rows)
}

/// What the app's three effort levels mean in tokens.
///
/// A budget rather than a reasoning flag: it is the one control every dialect here honours,
/// and the difference the user actually feels is whether the answer had room to finish. A
/// patch for the engine is a line or two; a bug report or a read of the log is not.
fn answer_tokens(effort: &str) -> u32 {
    match effort {
        "low" => 512,
        "high" => 8192,
        _ => 2048,
    }
}

/// Gemini names the model in the path instead of the body, so an override has to be spliced
/// into the url. Derived from the constant rather than rebuilt, so there is still one place
/// the address is written down.
fn endpoint(provider: &Provider, override_model: &str) -> String {
    let chosen = model(provider, override_model);
    if matches!(provider.dialect, Dialect::Gemini) && chosen != provider.model {
        return provider.endpoint.replace(provider.model, chosen);
    }
    provider.endpoint.to_owned()
}

/// Which model to name: the user's own choice if they made one, else the provider's default.
fn model<'a>(provider: &'a Provider, override_model: &'a str) -> &'a str {
    let chosen = override_model.trim();
    if chosen.is_empty() {
        provider.model
    } else {
        chosen
    }
}

/// The request body, in whichever dialect the provider expects.
fn body(
    provider: &Provider,
    prompt: &str,
    override_model: &str,
    effort: &str,
) -> serde_json::Value {
    let model = model(provider, override_model);
    let tokens = answer_tokens(effort);
    match provider.dialect {
        // `max_tokens` rather than `max_completion_tokens`: Groq and Mistral speak this dialect
        // too, and it is the spelling all three accept. A reasoning model named by hand in the
        // settings is the one case that would want the newer key.
        Dialect::OpenAi => serde_json::json!({
            "model": model,
            "max_tokens": tokens,
            "messages": [{ "role": "user", "content": prompt }],
        }),
        // Gemini names the model in the url, not in the body, so only the budget travels here.
        Dialect::Gemini => serde_json::json!({
            "contents": [{ "parts": [{ "text": prompt }] }],
            "generationConfig": { "maxOutputTokens": tokens },
        }),
        Dialect::Anthropic => serde_json::json!({
            "model": model,
            "max_tokens": tokens,
            "messages": [{ "role": "user", "content": prompt }],
        }),
    }
}

/// Digs the answer out of whichever envelope came back.
fn extract(provider: &Provider, value: &serde_json::Value) -> Option<String> {
    let text = match provider.dialect {
        Dialect::OpenAi => value["choices"][0]["message"]["content"].as_str()?,
        Dialect::Gemini => value["candidates"][0]["content"]["parts"][0]["text"].as_str()?,
        Dialect::Anthropic => value["content"][0]["text"].as_str()?,
    };
    Some(text.trim().to_owned())
}

/// Asks one hosted provider and returns its answer.
///
/// The call is made here rather than in the chrome webview on purpose: the key never
/// reaches the frontend, and the window's content policy stays closed to every remote host.
pub fn ask(
    provider: &Provider,
    key: &str,
    prompt: &str,
    override_model: &str,
    effort: &str,
) -> Result<String> {
    if key.trim().is_empty() {
        return Err(Error::Message(format!(
            "no API key set for {}",
            provider.id
        )));
    }

    let client = reqwest::blocking::Client::builder()
        .timeout(TIMEOUT)
        .build()
        .map_err(|error| Error::Message(error.to_string()))?;

    let mut request = client.post(endpoint(provider, override_model)).json(&body(
        provider,
        prompt,
        override_model,
        effort,
    ));

    request = match provider.dialect {
        Dialect::OpenAi => request.bearer_auth(key),
        // Gemini takes the key in a header rather than the query string, which keeps it out
        // of proxy logs and crash reports.
        Dialect::Gemini => request.header("x-goog-api-key", key),
        Dialect::Anthropic => request
            .header("x-api-key", key)
            .header("anthropic-version", "2023-06-01"),
    };

    let response = request
        .send()
        .map_err(|error| Error::Message(strip_key(&error.to_string(), key)))?;

    let status = response.status();
    let value: serde_json::Value = response
        .json()
        .map_err(|error| Error::Message(strip_key(&error.to_string(), key)))?;

    if !status.is_success() {
        let message = value["error"]["message"]
            .as_str()
            .unwrap_or("the provider refused the request");
        return Err(Error::Message(strip_key(message, key)));
    }

    extract(provider, &value)
        .ok_or_else(|| Error::Message("the provider returned no answer".to_owned()))
}

/// Opens a provider's free-key page in the system browser.
///
/// Takes a provider id rather than a URL: the address then comes from the table above and
/// never from the window, so nothing the frontend can say ends up as an argument to the shell.
pub fn open_free_key_url(id: &str) -> Result<()> {
    let provider = find(id).ok_or_else(|| Error::Message(format!("unknown provider '{id}'")))?;
    let url = provider
        .free_key_url
        .ok_or_else(|| Error::Message(format!("{id} has no free key page")))?;

    tauri_plugin_opener::open_url(url, None::<&str>).map_err(|e| Error::Message(e.to_string()))
}

/// Keeps a key out of anything the window will show or log.
fn strip_key(message: &str, key: &str) -> String {
    if key.is_empty() {
        return message.to_owned();
    }
    message.replace(key, "***")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn every_provider_is_reachable_by_id() {
        for provider in PROVIDERS {
            assert!(find(provider.id).is_some());
        }
        assert!(find("nope").is_none());
    }

    #[test]
    fn each_dialect_builds_the_body_it_expects() {
        let openai = find("openai").unwrap();
        assert_eq!(
            body(openai, "hi", "", "medium")["messages"][0]["content"],
            "hi"
        );

        let gemini = find("gemini").unwrap();
        assert_eq!(
            body(gemini, "hi", "", "medium")["contents"][0]["parts"][0]["text"],
            "hi"
        );

        let anthropic = find("anthropic").unwrap();
        assert_eq!(
            body(anthropic, "hi", "", "medium")["messages"][0]["content"],
            "hi"
        );
        assert!(body(anthropic, "hi", "", "medium")["max_tokens"].is_number());
    }

    #[test]
    fn effort_decides_the_room_the_answer_gets() {
        let anthropic = find("anthropic").unwrap();
        let tokens = |effort| {
            body(anthropic, "hi", "", effort)["max_tokens"]
                .as_u64()
                .unwrap()
        };

        assert!(tokens("low") < tokens("medium"));
        assert!(tokens("medium") < tokens("high"));
        // A settings file from before this existed carries no level at all.
        assert_eq!(tokens(""), tokens("medium"));
    }

    #[test]
    fn a_named_model_replaces_the_provider_default_wherever_it_lives() {
        let anthropic = find("anthropic").unwrap();
        assert_eq!(
            body(anthropic, "hi", "claude-opus-4-1", "low")["model"],
            "claude-opus-4-1"
        );
        assert_eq!(body(anthropic, "hi", "  ", "low")["model"], anthropic.model);

        // Gemini carries it in the path instead, so the url is what has to change.
        let gemini = find("gemini").unwrap();
        assert!(endpoint(gemini, "gemini-3-pro").contains("gemini-3-pro:generateContent"));
        assert_eq!(endpoint(gemini, ""), gemini.endpoint);
        // Everyone else posts to one address whatever the model is.
        assert_eq!(endpoint(anthropic, "claude-opus-4-1"), anthropic.endpoint);
    }

    #[test]
    fn each_dialect_finds_its_answer() {
        let openai = find("openai").unwrap();
        let value = serde_json::json!({ "choices": [{ "message": { "content": " yes " } }] });
        assert_eq!(extract(openai, &value).as_deref(), Some("yes"));

        let gemini = find("gemini").unwrap();
        let value =
            serde_json::json!({ "candidates": [{ "content": { "parts": [{ "text": "yes" }] } }] });
        assert_eq!(extract(gemini, &value).as_deref(), Some("yes"));

        let anthropic = find("anthropic").unwrap();
        let value = serde_json::json!({ "content": [{ "text": "yes" }] });
        assert_eq!(extract(anthropic, &value).as_deref(), Some("yes"));
    }

    #[test]
    fn an_answer_that_is_not_there_is_not_invented() {
        let openai = find("openai").unwrap();
        assert!(extract(openai, &serde_json::json!({ "choices": [] })).is_none());
    }

    #[test]
    fn a_missing_key_never_reaches_the_network() {
        let provider = find("openai").unwrap();
        assert!(ask(provider, "   ", "question", "", "medium").is_err());
    }

    #[test]
    fn only_a_known_provider_with_a_free_page_can_be_opened() {
        assert!(open_free_key_url("nope").is_err());
        // OpenAI charges, so it has no page to open and must not silently pass.
        assert!(open_free_key_url("openai").is_err());
    }

    #[test]
    fn a_key_is_scrubbed_from_anything_reported() {
        let message = strip_key("bad token sk-secret-123 rejected", "sk-secret-123");
        assert_eq!(message, "bad token *** rejected");
        assert!(!message.contains("sk-secret"));
    }
}
