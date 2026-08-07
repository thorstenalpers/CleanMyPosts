use crate::log::LogBuffer;
use crate::settings::SettingsStore;
use std::collections::HashMap;
use std::sync::Mutex;
use tokio::sync::oneshot;

/// One in-flight `site.runAction`. `deleted` is kept up to date from progress messages so
/// a cancel can still resolve the call with the count achieved so far, matching the
/// contract's promise that cancelling resolves rather than rejects.
pub struct Run {
    pub deleted: u32,
    pub responder: Option<oneshot::Sender<Result<u32, String>>>,
}

#[derive(Default)]
pub struct Runs(pub Mutex<HashMap<String, Run>>);

/// What the site webview last told us about itself. `eval` has no return channel, so the
/// injected script reports this instead of the host asking for it.
#[derive(Default)]
pub struct SiteInfo {
    pub user_name: String,
    /// Per platform, so a sign-in is logged once rather than on every report the page makes.
    pub logged_in: HashMap<String, bool>,
}

pub struct AppState {
    pub settings: SettingsStore,
    pub logs: LogBuffer,
    pub runs: Runs,
    pub site: Mutex<SiteInfo>,
    /// Held between the check and the install so the version the user agreed to is the one
    /// that gets written over the running app.
    pub pending_update: Mutex<Option<tauri_plugin_updater::Update>>,
}
