pub mod settings;
pub mod site;
pub mod system;

use crate::error::{Error, Result};
use serde_json::Value;
use tauri::AppHandle;

/// The one place a bridge method name is mapped to code. Every entry here needs a matching
/// entry in the UI's `BridgeMethods` map (`src/lib/bridge/contract.ts`); nothing checks
/// that automatically, so the two move together by hand.
pub async fn dispatch(app: AppHandle, method: String, params: Value) -> Result<Value> {
    match method.as_str() {
        "app.getInfo" => system::get_info(),

        "settings.get" => settings::get(&app),
        "settings.set" => settings::set(&app, params),

        "site.navigate" => site::navigate(&app, &params),
        "site.runAction" => site::run_action(app, &params).await,
        "site.cancelAction" => site::cancel_action(&app, &params),
        "site.hide" => site::hide(&app, &params),
        "site.show" => site::show(&app, &params),
        "site.reload" => site::reload(&app),

        "layout.setChromeWidth" => site::set_chrome_width(&app, &params),
        "layout.setBackground" => site::set_background(&app, &params),

        "updater.checkForUpdates" => system::check_for_updates(&app).await,
        "system.openUrl" => system::open_url(&params),
        "system.openLicense" => system::open_license(&app),

        "log.getBuffer" => system::get_log_buffer(&app),

        other => Err(Error::Message(format!("unknown bridge method \"{other}\""))),
    }
}
