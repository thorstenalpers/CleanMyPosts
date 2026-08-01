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
