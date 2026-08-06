use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TimeoutSettings {
    pub wait_after_delete: u64,
    pub wait_between_retry_delete_attempts: u64,
    pub wait_after_document_load: u64,
}

impl Default for TimeoutSettings {
    fn default() -> Self {
        Self {
            wait_after_delete: 500,
            wait_between_retry_delete_attempts: 500,
            wait_after_document_load: 3000,
        }
    }
}

/// Serde needs a function for a defaulted `bool`; these default to on, so a settings
/// file written before they existed keeps behaving the way it did.
fn yes() -> bool {
    true
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub theme: String,
    pub language: String,
    pub show_intro: bool,
    pub show_logs: bool,
    pub show_x: bool,
    #[serde(rename = "showYouTube")]
    pub show_youtube: bool,
    pub confirm_deletion: bool,
    /// A toast when a run ends. Off leaves the log as the only report.
    #[serde(default = "yes")]
    pub notifications: bool,
    /// Whether the engine's `debug` lines are kept. Off by default — they quote what a
    /// platform page showed, which is more than the ordinary log carries.
    #[serde(default)]
    pub debug_logging: bool,
    /// Whether the content script dismisses cookie banners by itself.
    #[serde(default = "yes")]
    pub auto_consent: bool,
    /// Off wipes the WebView2 profile at start-up, so both platforms open signed out.
    #[serde(default = "yes")]
    pub persist_session: bool,
    pub theme_preset: String,
    pub show_assistant: bool,
    /// `claude-code` for the local binary, otherwise a provider id from `assistant::providers`.
    pub assistant_source: String,
    /// Empty means: look in the places Claude Code installs itself.
    pub assistant_cli_path: String,
    /// The user's own patch for the delete engine, evaluated in the site page before each
    /// action. Empty means the engine's built-in configuration.
    #[serde(default)]
    pub engine_script: String,
    pub timeouts: TimeoutSettings,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            theme: "Default".into(),
            language: "System".into(),
            show_intro: true,
            show_logs: false,
            show_x: true,
            show_youtube: true,
            confirm_deletion: true,
            notifications: true,
            debug_logging: false,
            auto_consent: true,
            persist_session: true,
            theme_preset: "default".into(),
            show_assistant: true,
            assistant_source: crate::assistant::LOCAL.into(),
            assistant_cli_path: String::new(),
            engine_script: String::new(),
            timeouts: TimeoutSettings::default(),
        }
    }
}

/// Kept in step with `ThemePresetSchema` in `src/lib/bridge/contract.ts` and the classes in
/// `src/themes.css`. The host does not style anything; it only refuses to hand the UI a name
/// the UI would reject.
const THEME_PRESETS: [&str; 7] = [
    "default",
    "caffeine",
    "modern-minimal",
    "mono",
    "northern-lights",
    "twitter",
    "vercel",
];

pub struct SettingsStore {
    path: PathBuf,
    current: Mutex<AppSettings>,
}

impl SettingsStore {
    /// Reads once at startup; a corrupt or missing file falls back to defaults rather
    /// than failing the launch, since settings are conveniences, not state the app needs.
    pub fn load(path: PathBuf) -> Self {
        let mut current: AppSettings = std::fs::read_to_string(&path)
            .ok()
            .and_then(|text| serde_json::from_str(&text).ok())
            .unwrap_or_default();

        // A preset that no longer exists would fail the UI's own schema check and take the
        // whole settings call down with it, so a retired name reads as the neutral base.
        if !THEME_PRESETS.contains(&current.theme_preset.as_str()) {
            current.theme_preset = AppSettings::default().theme_preset;
        }

        Self {
            path,
            current: Mutex::new(current),
        }
    }

    pub fn get(&self) -> AppSettings {
        self.current.lock().expect("settings mutex").clone()
    }

    pub fn set(&self, next: AppSettings) -> Result<(), String> {
        if let Some(parent) = self.path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        let text = serde_json::to_string_pretty(&next).map_err(|e| e.to_string())?;
        std::fs::write(&self.path, text).map_err(|e| e.to_string())?;
        *self.current.lock().expect("settings mutex") = next;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicU32, Ordering};

    fn temp_path() -> PathBuf {
        static COUNTER: AtomicU32 = AtomicU32::new(0);
        let n = COUNTER.fetch_add(1, Ordering::Relaxed);
        std::env::temp_dir()
            .join(format!("cmp-settings-test-{}-{n}", std::process::id()))
            .join("settings.json")
    }

    #[test]
    fn missing_file_yields_defaults() {
        let store = SettingsStore::load(temp_path());
        let settings = store.get();

        assert_eq!(settings.theme, "Default");
        assert!(settings.confirm_deletion);
        assert_eq!(settings.timeouts.wait_after_delete, 500);
    }

    #[test]
    fn corrupt_file_yields_defaults_instead_of_failing() {
        let path = temp_path();
        std::fs::create_dir_all(path.parent().unwrap()).unwrap();
        std::fs::write(&path, "{ this is not json").unwrap();

        assert_eq!(SettingsStore::load(path).get().theme, "Default");
    }

    #[test]
    fn set_persists_and_is_read_back_by_a_fresh_store() {
        let path = temp_path();
        let store = SettingsStore::load(path.clone());

        let mut next = store.get();
        next.theme = "Dark".into();
        next.show_logs = true;
        next.timeouts.wait_after_delete = 1234;
        store.set(next).unwrap();

        let reloaded = SettingsStore::load(path).get();
        assert_eq!(reloaded.theme, "Dark");
        assert!(reloaded.show_logs);
        assert_eq!(reloaded.timeouts.wait_after_delete, 1234);
    }

    /// The UI validates against camelCase Zod schemas, so a rename here would break the
    /// contract silently rather than at compile time.
    #[test]
    fn serializes_as_camel_case() {
        let json = serde_json::to_string(&AppSettings::default()).unwrap();

        assert!(json.contains("\"showLogs\""));
        assert!(json.contains("\"confirmDeletion\""));
        assert!(json.contains("\"showAssistant\""));
        assert!(json.contains("\"persistSession\""));
        assert!(json.contains("\"assistantSource\""));
        assert!(json.contains("\"assistantCliPath\""));
        assert!(json.contains("\"waitAfterDelete\""));
        assert!(json.contains("\"waitBetweenRetryDeleteAttempts\""));
        assert!(json.contains("\"waitAfterDocumentLoad\""));
    }
}
