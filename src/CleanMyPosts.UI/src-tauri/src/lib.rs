mod bridge;
mod log;
mod settings;

use bridge::AppState;
use serde_json::Value;
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{
    webview::WebviewBuilder, window::WindowBuilder, LogicalPosition, LogicalSize, Manager,
    WebviewUrl, WindowEvent,
};

const SIDEBAR_EXPANDED_WIDTH: f64 = 240.0;
const SIDEBAR_COLLAPSED_WIDTH: f64 = 56.0;

/// Mirrors the WPF host's column model: the chrome webview owns the sidebar strip, and it
/// takes over the whole window whenever a local page (Settings, Log) is showing.
static SIDEBAR_EXPANDED: AtomicBool = AtomicBool::new(true);
static SITE_HIDDEN: AtomicBool = AtomicBool::new(false);

/// The delete engine, built by `npm run build:content`. Injected verbatim so the
/// TypeScript under `src/lib/engine` stays the single source of truth.
const CONTENT_SCRIPT: &str = include_str!("../../dist/content/content.js");

/// The engine talks to its host through `chrome.webview.postMessage`, which only exists
/// inside WebView2's own host channel. Shimming it onto Tauri's invoke keeps the engine —
/// and its tests — free of any knowledge that the host changed.
///
/// The origin guard is not decoration: this script runs on every top-level navigation the
/// site webview makes, including anything the user clicks through to.
fn site_init_script() -> String {
    format!(
        r#"(function () {{
  var h = window.location.host;
  if (!(h === 'x.com' || h.endsWith('.x.com')
     || h === 'youtube.com' || h.endsWith('.youtube.com')
     || h === 'myactivity.google.com')) return;

  window.chrome = window.chrome || {{}};
  window.chrome.webview = {{
    postMessage: function (message) {{
      window.__TAURI__.core.invoke('content_message', {{ message: message }});
    }}
  }};

{engine}

  // `eval` has no return channel, so the page reports who is logged in rather than the
  // host asking. Repeated because these platforms swap the DOM in long after load.
  function report() {{
    if (!window.__cmp) return;
    try {{
      window.chrome.webview.postMessage({{
        type: 'siteInfo',
        host: h,
        userName: window.__cmp.getUserName(),
        loginStatus: window.__cmp.getLoginStatus()
      }});
    }} catch (e) {{}}
  }}
  if (document.readyState === 'complete') report();
  else window.addEventListener('load', report);
  setTimeout(report, 1500);
  setTimeout(report, 4000);
}})();"#,
        engine = CONTENT_SCRIPT
    )
}

#[tauri::command]
fn content_message(app: tauri::AppHandle, message: Value) {
    bridge::handle_content_message(&app, &message);
}

#[tauri::command]
async fn bridge_call(
    app: tauri::AppHandle,
    method: String,
    params: Value,
) -> Result<Value, String> {
    bridge::dispatch(app, method, params).await
}

pub fn set_sidebar_expanded(app: &tauri::AppHandle, expanded: bool) {
    SIDEBAR_EXPANDED.store(expanded, Ordering::Relaxed);
    layout_webviews(app);
}

pub fn set_site_hidden(app: &tauri::AppHandle, hidden: bool) {
    SITE_HIDDEN.store(hidden, Ordering::Relaxed);
    layout_webviews(app);
}

fn layout_webviews(app: &tauri::AppHandle) {
    let Some(window) = app.get_window("main") else {
        return;
    };
    let (Ok(scale), Ok(size)) = (window.scale_factor(), window.inner_size()) else {
        return;
    };
    let size = size.to_logical::<f64>(scale);

    let site_hidden = SITE_HIDDEN.load(Ordering::Relaxed);
    let chrome_width = if site_hidden {
        size.width
    } else if SIDEBAR_EXPANDED.load(Ordering::Relaxed) {
        SIDEBAR_EXPANDED_WIDTH
    } else {
        SIDEBAR_COLLAPSED_WIDTH
    };

    if let Some(chrome) = app.get_webview("chrome") {
        let _ = chrome.set_position(LogicalPosition::new(0.0, 0.0));
        let _ = chrome.set_size(LogicalSize::new(chrome_width, size.height));
    }
    if let Some(site) = app.get_webview("site") {
        // Parked off-screen rather than resized to zero: a zero-sized webview stops
        // laying out, which would reset the platform page's scroll position every time
        // the user glances at Settings.
        if site_hidden {
            let _ = site.set_position(LogicalPosition::new(size.width, 0.0));
        } else {
            let _ = site.set_position(LogicalPosition::new(chrome_width, 0.0));
            let _ = site.set_size(LogicalSize::new(
                (size.width - chrome_width).max(1.0),
                size.height,
            ));
        }
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![content_message, bridge_call])
        .setup(|app| {
            let settings_path = app
                .path()
                .app_config_dir()
                .map(|dir| dir.join("settings.json"))
                .unwrap_or_else(|_| std::path::PathBuf::from("settings.json"));

            app.manage(AppState {
                settings: settings::SettingsStore::load(settings_path),
                logs: log::LogBuffer::new(),
                runs: bridge::Runs::default(),
                site: std::sync::Mutex::new(bridge::SiteInfo::default()),
            });

            let window = WindowBuilder::new(app, "main")
                .title("CleanMyPosts")
                .inner_size(1200.0, 800.0)
                .build()?;

            let scale = window.scale_factor()?;
            let size = window.inner_size()?.to_logical::<f64>(scale);

            window.add_child(
                WebviewBuilder::new("chrome", WebviewUrl::default()),
                LogicalPosition::new(0.0, 0.0),
                LogicalSize::new(SIDEBAR_EXPANDED_WIDTH, size.height),
            )?;

            window.add_child(
                WebviewBuilder::new(
                    "site",
                    WebviewUrl::External("https://x.com".parse().expect("static url")),
                )
                .initialization_script_for_all_frames(site_init_script()),
                LogicalPosition::new(SIDEBAR_EXPANDED_WIDTH, 0.0),
                LogicalSize::new(size.width - SIDEBAR_EXPANDED_WIDTH, size.height),
            )?;

            let handle = app.handle().clone();
            window.on_window_event(move |event| {
                if matches!(event, WindowEvent::Resized(_)) {
                    layout_webviews(&handle);
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running CleanMyPosts");
}
