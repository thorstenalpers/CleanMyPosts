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

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub theme: String,
    pub show_logs: bool,
    pub confirm_deletion: bool,
    pub timeouts: TimeoutSettings,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            theme: "Default".into(),
            show_logs: false,
            confirm_deletion: true,
            timeouts: TimeoutSettings::default(),
        }
    }
}

pub struct SettingsStore {
    path: PathBuf,
    current: Mutex<AppSettings>,
}

impl SettingsStore {
    /// Reads once at startup; a corrupt or missing file falls back to defaults rather
    /// than failing the launch, since settings are conveniences, not state the app needs.
    pub fn load(path: PathBuf) -> Self {
        let current = std::fs::read_to_string(&path)
            .ok()
            .and_then(|text| serde_json::from_str(&text).ok())
            .unwrap_or_default();

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
        assert!(json.contains("\"waitAfterDelete\""));
        assert!(json.contains("\"waitBetweenRetryDeleteAttempts\""));
        assert!(json.contains("\"waitAfterDocumentLoad\""));
    }
}
