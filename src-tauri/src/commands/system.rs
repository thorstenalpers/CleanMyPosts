use crate::bridge::{log, push_event};
use crate::error::{Error, Result};
use crate::state::AppState;
use serde_json::{json, Value};
use tauri::{AppHandle, Manager};

pub const HOMEPAGE_URL: &str = "https://github.com/thorstenalpers/CleanMyPosts";
pub const REPORT_BUG_URL: &str = "https://github.com/thorstenalpers/CleanMyPosts/issues";
/// The anchor GitHub generates for the README's "🩺 Troubleshooting" heading.
pub const TROUBLESHOOTING_URL: &str =
    "https://github.com/thorstenalpers/CleanMyPosts#-troubleshooting";

/// Stamped in by `build.rs`.
///
/// `option_env!` rather than `env!`: a toolchain that compiles this file without having run
/// the build script — rust-analyzer with build scripts disabled, an editor's own check — must
/// not turn a missing stamp into an error in application code. A real build always has it,
/// and the test below is what makes sure of that.
const BUILD_DATE: &str = match option_env!("CMP_BUILD_DATE") {
    Some(date) => date,
    None => "unknown",
};

pub fn get_info() -> Result<Value> {
    Ok(json!({
        "version": env!("CARGO_PKG_VERSION"),
        "buildDate": BUILD_DATE,
        "homepageUrl": HOMEPAGE_URL,
        "reportBugUrl": REPORT_BUG_URL,
        "troubleshootingUrl": TROUBLESHOOTING_URL,
    }))
}

pub fn open_url(params: &Value) -> Result<Value> {
    let url = params.get("url").and_then(Value::as_str).unwrap_or("");
    tauri_plugin_opener::open_url(url, None::<&str>).map_err(|e| Error::Message(e.to_string()))?;
    Ok(Value::Null)
}

pub fn open_license(app: &AppHandle) -> Result<Value> {
    let path = app
        .path()
        .resource_dir()
        .map_err(|e| Error::Message(e.to_string()))?
        .join("THIRD_PARTY_LICENSES.txt");
    tauri_plugin_opener::open_path(path.to_string_lossy().to_string(), None::<&str>)
        .map_err(|e| Error::Message(e.to_string()))?;
    Ok(Value::Null)
}

pub fn get_log_buffer(app: &AppHandle) -> Result<Value> {
    let entries = app.state::<AppState>().logs.snapshot();
    Ok(serde_json::to_value(entries)?)
}

/// Only reports what is on offer. Nothing is downloaded until the UI has shown the version
/// and the user has agreed to it, because installing ends with the app restarting.
pub async fn check_for_updates(app: &AppHandle) -> Result<Value> {
    use tauri_plugin_updater::UpdaterExt;

    let update = app
        .updater()
        .map_err(|e| Error::Message(e.to_string()))?
        .check()
        .await
        .map_err(|e| Error::Message(e.to_string()))?;

    let result = match &update {
        Some(update) => json!({
            "updateAvailable": true,
            "version": update.version,
            // `notes` in latest.json: the release-notes markdown the workflow copied in.
            "notes": update.body,
        }),
        None => json!({ "updateAvailable": false }),
    };
    *app.state::<AppState>()
        .pending_update
        .lock()
        .expect("pending update mutex") = update;

    Ok(result)
}

/// Never returns on success. On Windows `download_and_install` hands the NSIS setup to the
/// shell and calls `std::process::exit` itself, so the `app.restart()` below is the
/// terminator this signature needs rather than the thing that restarts anything — that is
/// the installer's `/R`.
pub async fn install_update(app: &AppHandle) -> Result<Value> {
    let update = app
        .state::<AppState>()
        .pending_update
        .lock()
        .expect("pending update mutex")
        .take()
        .ok_or_else(|| Error::Message("No update is waiting to be installed.".into()))?;

    log(
        app,
        "info",
        format!("Installing update {}…", update.version),
    );

    let handle = app.clone();
    let mut downloaded = 0u64;
    let mut last_step = u64::MAX;
    update
        .download_and_install(
            move |chunk, content_length| {
                downloaded += chunk as u64;
                // A chunk is tens of kilobytes, so an installer is thousands of them. The bar
                // has a hundred steps, and an unmeasured download only counts megabytes;
                // anything finer is traffic the UI throws away.
                let step = match content_length {
                    Some(total) if total > 0 => downloaded * 100 / total,
                    _ => downloaded / 1_048_576,
                };
                if step != last_step {
                    last_step = step;
                    push_event(
                        &handle,
                        "updateProgress",
                        json!({ "downloaded": downloaded, "contentLength": content_length }),
                    );
                }
            },
            || {},
        )
        .await
        .map_err(|e| Error::Message(e.to_string()))?;

    app.restart();
}

#[cfg(test)]
mod tests {
    use super::BUILD_DATE;

    /// The gate on `build.rs`. `get_info` falls back to "unknown" so a check without a build
    /// script cannot break the build, which leaves this test as the only thing standing
    /// between a broken stamp and a version row reading "built unknown" — or "built
    /// 1970-01-01".
    #[test]
    fn the_build_date_is_stamped_in_as_a_civil_date() {
        let date = BUILD_DATE;

        assert_ne!(date, "unknown", "build.rs did not stamp CMP_BUILD_DATE in");
        assert_eq!(date.len(), 10, "unexpected shape: {date}");
        assert!(date.starts_with("20"), "implausible year: {date}");
        let parts: Vec<&str> = date.split('-').collect();
        assert_eq!(parts.len(), 3, "not YYYY-MM-DD: {date}");
        assert!((1..=12).contains(&parts[1].parse::<u32>().expect("month")));
        assert!((1..=31).contains(&parts[2].parse::<u32>().expect("day")));
    }
}
