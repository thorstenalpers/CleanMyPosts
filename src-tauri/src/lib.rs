mod assistant;
mod bridge;
mod commands;
mod error;
mod log;
mod settings;
mod state;

use serde_json::Value;
use state::AppState;
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::Mutex;
use tauri::{
    webview::WebviewBuilder, window::WindowBuilder, LogicalPosition, LogicalSize, Manager,
    WebviewUrl, WindowEvent,
};
use tauri_plugin_window_state::{StateFlags, WindowExt};

/// The expanded sidebar on its own — what the chrome is worth before any rail beside it.
pub const DEFAULT_CHROME_WIDTH: u32 = 240;

/// Geometry only. `VISIBLE`, `DECORATIONS` and `FULLSCREEN` are deliberately left out: a
/// window restored hidden or undecorated is a launch the user cannot recover from.
const WINDOW_STATE_FLAGS: StateFlags = StateFlags::SIZE
    .union(StateFlags::POSITION)
    .union(StateFlags::MAXIMIZED);

/// One webview per platform, both alive for the whole session. A single shared one had to
/// be re-navigated on every switch, which is the same thing as throwing the page away:
/// scroll position, opened threads, and half-finished logins all went with it.
const SITE_WEBVIEWS: [(&str, &str); 2] = [
    ("site-x", "https://x.com"),
    ("site-youtube", "https://www.youtube.com"),
];

/// The chrome webview owns the sidebar strip plus whatever the UI shows next to it, and
/// takes over the whole window whenever a local page (Overview, Settings, Log) is showing.
/// The UI is the only one that knows how wide it currently is, so it reports the number.
static CHROME_WIDTH: AtomicU32 = AtomicU32::new(DEFAULT_CHROME_WIDTH);
/// Hidden until the UI says otherwise: the app opens on Overview, and a site webview
/// flashing over it before the first layout call would be the first thing the user sees.
static SITE_HIDDEN: AtomicBool = AtomicBool::new(true);
static ACTIVE_SITE: Mutex<&'static str> = Mutex::new(SITE_WEBVIEWS[0].0);

pub fn site_webview_label(platform: &str) -> &'static str {
    if platform == "youtube" {
        SITE_WEBVIEWS[1].0
    } else {
        SITE_WEBVIEWS[0].0
    }
}

pub fn active_site_webview_label() -> &'static str {
    *ACTIVE_SITE.lock().expect("active site mutex")
}

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
async fn bridge_call(app: tauri::AppHandle, method: String, params: Value) -> error::Result<Value> {
    commands::dispatch(app, method, params).await
}

pub fn set_chrome_width(app: &tauri::AppHandle, width: u32) {
    CHROME_WIDTH.store(width.max(1), Ordering::Relaxed);
    layout_webviews(app);
}

pub fn set_site_hidden(app: &tauri::AppHandle, hidden: bool) {
    SITE_HIDDEN.store(hidden, Ordering::Relaxed);
    layout_webviews(app);
}

/// Brings a platform's webview forward. Deliberately does not navigate it: showing a page
/// again is not a reason to reload it.
pub fn show_site(app: &tauri::AppHandle, platform: &str) {
    *ACTIVE_SITE.lock().expect("active site mutex") = site_webview_label(platform);
    SITE_HIDDEN.store(false, Ordering::Relaxed);
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
    let site_x = f64::from(CHROME_WIDTH.load(Ordering::Relaxed)).min(size.width);
    let chrome_width = if site_hidden { size.width } else { site_x };

    if let Some(chrome) = app.get_webview("chrome") {
        let _ = chrome.set_position(LogicalPosition::new(0.0, 0.0));
        let _ = chrome.set_size(LogicalSize::new(chrome_width, size.height));
    }

    // Sized and placed against `site_x` rather than the chrome's current width: a site
    // parked behind a full-window chrome must keep the rectangle it will come back at, or
    // it reflows on the way in.
    let site_width = (size.width - site_x).max(1.0);
    let active = active_site_webview_label();
    for (label, _) in SITE_WEBVIEWS {
        let Some(site) = app.get_webview(label) else {
            continue;
        };
        // Parked off-screen rather than resized to zero: a zero-sized webview stops
        // laying out, which would reset the platform page's scroll position every time
        // the user glances at Settings — or at the other platform.
        let showing = !site_hidden && label == active;
        let x = if showing { site_x } else { size.width };
        let _ = site.set_size(LogicalSize::new(site_width, size.height));
        let _ = site.set_position(LogicalPosition::new(x, 0.0));
    }
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(
            tauri_plugin_window_state::Builder::new()
                .with_state_flags(WINDOW_STATE_FLAGS)
                .build(),
        )
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
                runs: state::Runs::default(),
                site: std::sync::Mutex::new(state::SiteInfo::default()),
            });

            let window = WindowBuilder::new(app, "main")
                .title("CleanMyPosts")
                .inner_size(1200.0, 800.0)
                .build()?;

            // Before the size is read: every child webview below is positioned against it,
            // and a window that grows after they are placed leaves them at the old rectangle.
            let _ = window.restore_state(WINDOW_STATE_FLAGS);

            let scale = window.scale_factor()?;
            let size = window.inner_size()?.to_logical::<f64>(scale);

            // The app's own UI first, and full width to start with, matching SITE_HIDDEN:
            // the app opens on Overview. Building it before anything else is what puts
            // something on screen — its page is a local prerendered file, so it paints as
            // soon as it exists.
            window.add_child(
                WebviewBuilder::new("chrome", WebviewUrl::default()),
                LogicalPosition::new(0.0, 0.0),
                LogicalSize::new(size.width, size.height),
            )?;

            // Both platforms load at once and stay loaded — parked off-screen at the right
            // size so the first switch to either is a move, not a page load.
            //
            // Queued rather than built here: constructing two external webviews is
            // synchronous main-thread work, and x.com and youtube.com start fetching the
            // moment they exist. Done inline it held the window empty until both were up.
            // The layout and the site commands already tolerate a webview that is not there
            // yet, so the only thing this costs is that the very first click on a platform
            // may land a beat early.
            let site_window = window.clone();
            let _ = window.run_on_main_thread(move || {
                for (label, url) in SITE_WEBVIEWS {
                    let built = site_window.add_child(
                        WebviewBuilder::new(
                            label,
                            WebviewUrl::External(url.parse().expect("static url")),
                        )
                        .initialization_script_for_all_frames(site_init_script()),
                        LogicalPosition::new(size.width, 0.0),
                        LogicalSize::new(size.width - f64::from(DEFAULT_CHROME_WIDTH), size.height),
                    );
                    if let Err(error) = built {
                        eprintln!("could not create the {label} webview: {error}");
                    }
                }
            });

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
