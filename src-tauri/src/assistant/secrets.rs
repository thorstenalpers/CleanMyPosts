//! API keys, in the Windows Credential Manager.
//!
//! A key never crosses to the frontend and never appears in a log or an error message. The
//! window may ask whether one is set and may replace it; it can never read it back. It is
//! deliberately not in `settings.json` — that file is the app's own preferences and is not
//! protected against anything.

use crate::error::{Error, Result};

const SERVICE: &str = "CleanMyPosts";

fn entry(provider: &str) -> Result<keyring::Entry> {
    if super::providers::find(provider).is_none() {
        return Err(Error::Message(format!("unknown provider '{provider}'")));
    }
    keyring::Entry::new(SERVICE, provider)
        .map_err(|error| Error::Message(format!("the key store refused: {error}")))
}

pub fn set(provider: &str, key: &str) -> Result<()> {
    let entry = entry(provider)?;
    if key.trim().is_empty() {
        // An empty field means "forget it", which is what the reset button sends.
        return match entry.delete_credential() {
            Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
            Err(error) => Err(Error::Message(format!("the key store refused: {error}"))),
        };
    }
    entry
        .set_password(key.trim())
        .map_err(|error| Error::Message(format!("the key store refused: {error}")))
}

pub fn get(provider: &str) -> Result<Option<String>> {
    match entry(provider)?.get_password() {
        Ok(key) => Ok(Some(key)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(error) => Err(Error::Message(format!("the key store refused: {error}"))),
    }
}

/// Whether a key exists — never the key itself.
pub fn has(provider: &str) -> bool {
    matches!(get(provider), Ok(Some(_)))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn an_unknown_provider_is_refused_before_the_store_is_touched() {
        assert!(set("not-a-provider", "x").is_err());
        assert!(get("not-a-provider").is_err());
        assert!(!has("not-a-provider"));
    }

    #[test]
    #[ignore = "writes to the developer's own credential store"]
    fn a_key_round_trips_and_can_be_forgotten() {
        set("openai", "test-key-please-ignore").unwrap();
        assert_eq!(
            get("openai").unwrap().as_deref(),
            Some("test-key-please-ignore")
        );
        assert!(has("openai"));

        set("openai", "").unwrap();
        assert_eq!(get("openai").unwrap(), None);
        assert!(!has("openai"));
    }
}
