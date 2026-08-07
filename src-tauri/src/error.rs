use serde::{Serialize, Serializer};

/// Everything a command can fail with. Serialises to the bare message because the UI's
/// bridge envelope carries `{ ok: false, error: { message } }` and has no field for a code.
#[derive(Debug)]
pub enum Error {
    /// The requested `(platform, action)` pair has no page to run on.
    NoTarget { platform: String, action: String },
    /// A required parameter was missing from the RPC payload.
    MissingParam(&'static str),
    /// The site webview is gone or refused the script.
    Site(String),
    /// The run ended without a `done` or `error` message.
    Abandoned,
    /// Anything reported verbatim by a plugin or the content script.
    Message(String),
}

impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Error::NoTarget { platform, action } => write!(f, "no page for {platform}:{action}"),
            Error::MissingParam(name) => write!(f, "{name} missing"),
            Error::Site(message) => write!(f, "{message}"),
            Error::Abandoned => write!(f, "The run ended without reporting a result."),
            Error::Message(message) => write!(f, "{message}"),
        }
    }
}

impl std::error::Error for Error {}

impl Serialize for Error {
    fn serialize<S: Serializer>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error> {
        serializer.serialize_str(&self.to_string())
    }
}

impl From<serde_json::Error> for Error {
    fn from(error: serde_json::Error) -> Self {
        Error::Message(error.to_string())
    }
}

impl From<tauri::Error> for Error {
    fn from(error: tauri::Error) -> Self {
        Error::Site(error.to_string())
    }
}

pub type Result<T> = std::result::Result<T, Error>;
