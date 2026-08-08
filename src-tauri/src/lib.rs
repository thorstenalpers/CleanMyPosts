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
/// In step with the header bar's `h-11`. Only a fallback: the UI reports its own.
pub const DEFAULT_HEADER_HEIGHT: u32 = 44;

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
static SITE_TOP: AtomicU32 = AtomicU32::new(DEFAULT_HEADER_HEIGHT);
/// What the app keeps for itself below the platform: the status bar. The site is shortened
/// rather than covered — one webview cannot paint over another, so the room has to be real.
static SITE_BOTTOM: AtomicU32 = AtomicU32::new(0);
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

/// The colour the window wears until the page paints its own.
///
/// Light and dark only. The exact shade belongs to the theme preset, which lives in CSS and
/// arrives with the page — by then `layout.setBackground` has already corrected this.
fn startup_background(window: &tauri::Window, theme: &str) -> tauri::utils::config::Color {
    let dark = match theme {
        "Dark" => true,
        "Light" => false,
        _ => window
            .theme()
            .map(|t| t == tauri::Theme::Dark)
            .unwrap_or(false),
    };
    if dark {
        tauri::utils::config::Color(10, 10, 10, 255)
    } else {
        tauri::utils::config::Color(255, 255, 255, 255)
    }
}

/// The delete engine, built by `npm run build:content`. Injected verbatim so the
/// TypeScript under `src/lib/engine` stays the single source of truth.
const CONTENT_SCRIPT: &str = include_str!("../../dist/content/content.js");

/// The engine talks to its host through `chrome.webview.postMessage`. Routing that one
/// method onto Tauri's invoke keeps the engine — and its tests — free of any knowledge that
/// the host changed. The method, not the object: WebView2 puts its own bridge there.
///
/// The origin guard is not decoration: this script runs on every top-level navigation the
/// site webview makes, including anything the user clicks through to.
fn site_init_script(auto_consent: bool) -> String {
    format!(
        r#"(function () {{
  var h = window.location.host;
  if (!(h === 'x.com' || h.endsWith('.x.com')
     || h === 'youtube.com' || h.endsWith('.youtube.com')
     || h === 'myactivity.google.com')) return;

  // Inside WebView2 `chrome.webview` already exists — it is the runtime's own host bridge —
  // so assigning a replacement object over it fails silently, and the engine goes on talking
  // to a channel that drops every word. Replace the one method instead, and keep the original
  // reachable: wry routes Tauri's own ipc through here as
  // `window.ipc.postMessage = s => window.chrome.webview.postMessage(s)`. Those arrive as
  // strings and must reach the real bridge, or this shim swallows the whole app's ipc.
  //
  // `__TAURI_INTERNALS__` is injected into every main frame unconditionally; `__TAURI__` is
  // the `withGlobalTauri` convenience on top of it and the one that can be absent. A rejected
  // invoke is reported rather than dropped: this channel is the app's only way to hear from
  // the page, and a silent one looks exactly like a platform that renamed a selector.
  window.chrome = window.chrome || {{}};
  var bridge = window.chrome.webview;
  var native =
    bridge && typeof bridge.postMessage === 'function'
      ? bridge.postMessage.bind(bridge)
      : null;

  var post = function (message) {{
    if (typeof message === 'string') {{
      if (native) return native(message);
      return;
    }}
    try {{
      var core = window.__TAURI_INTERNALS__;
      if (!core || !core.invoke) core = (window.__TAURI__ || {{}}).core;
      if (!core || !core.invoke) throw new Error('no Tauri ipc in this frame');
      var result = core.invoke('content_message', {{ message: message }});
      if (result && result.catch) {{
        result.catch(function (e) {{
          console.error('[CleanMyPosts] the host refused a message:', e);
        }});
      }}
    }} catch (e) {{
      console.error('[CleanMyPosts] could not reach the host:', e);
    }}
  }};

  if (!bridge) {{
    window.chrome.webview = {{ postMessage: post }};
  }} else {{
    try {{
      bridge.postMessage = post;
    }} catch (e) {{}}
    if (bridge.postMessage !== post) {{
      try {{
        Object.defineProperty(bridge, 'postMessage', {{
          value: post,
          configurable: true,
          writable: true
        }});
      }} catch (e) {{}}
    }}
  }}

  try {{

{engine}

  }} catch (e) {{
    console.error('[CleanMyPosts] the engine failed to load:', e);
  }}

  // Each stage on its own: the report below is what tells the app a person is signed in, and
  // it must survive anything the engine trips over on its way up.
  try {{
    if (window.__cmp) window.__cmp.config.autoConsent = {auto_consent};
  }} catch (e) {{
    console.error('[CleanMyPosts] could not apply the consent setting:', e);
  }}

  // `eval` has no return channel, so the page reports who is logged in rather than the
  // host asking. Watched rather than sampled around load: on both platforms signing in
  // and moving between accounts happens without a document load, so a page that reported
  // "signed out" on its way in would never correct itself. Only the top frame reports —
  // a subframe would answer with its own URL.
  if (window.top === window) {{
    // Only the bad news. An engine that loaded is the normal case and wrote a line on every
    // navigation for nothing; one that did not is the difference between "no account here"
    // and "nothing ran at all", which otherwise look identical from the app.
    if (!window.__cmp) {{
      window.chrome.webview.postMessage({{
        type: 'log',
        level: 'warning',
        message: 'The delete engine did not load on ' + h + '.'
      }});
    }}

    var last = '';
    var ticks = 0;
    setInterval(function () {{
      if (!window.__cmp) return;
      try {{
        var info = {{
          type: 'siteInfo',
          host: h,
          url: window.location.href,
          userName: window.__cmp.getUserName(),
          loginStatus: window.__cmp.getLoginStatus()
        }};
        // Repeated every tenth tick even when nothing changed. These pages are up before the
        // app's own window is, and on a dev reload the window comes back a second time — a
        // report sent only on change would have been spoken to nobody.
        var key = info.url + '|' + info.userName + '|' + info.loginStatus;
        if (key === last && ++ticks % 10 !== 0) return;
        last = key;
        window.chrome.webview.postMessage(info);
      }} catch (e) {{}}
    }}, 1000);
  }}
}})();"#,
        engine = CONTENT_SCRIPT,
        auto_consent = auto_consent
    )
}

#[cfg(test)]
mod tests {
    /// A stray control character anywhere in this string is a `SyntaxError` for the whole
    /// script, in every document — the engine never registers, and the app sees exactly what
    /// it sees when a platform renames a selector: nothing at all.
    #[test]
    fn the_injected_script_carries_no_control_characters() {
        let script = super::site_init_script(true);
        let found: Vec<u32> = script
            .chars()
            .filter(|c| c.is_control() && *c != '\n' && *c != '\r' && *c != '\t')
            .map(u32::from)
            .collect();
        assert!(
            found.is_empty(),
            "control characters in the script: {found:?}"
        );
    }
}

/// Throws the WebView2 profile away — cache, cookies, and with them both platform logins.
///
/// A folder removal rather than `clear_all_browsing_data`: that one is asynchronous with no
/// way to wait for it, so the site webviews would race it and could load with the old
/// cookies still in place. Called before the first webview exists, which is the only moment
/// nothing holds the folder open.
fn clear_webview_session(app: &tauri::AppHandle) {
    let Ok(dir) = app.path().app_local_data_dir() else {
        return;
    };
    match std::fs::remove_dir_all(dir.join("EBWebView")) {
        Err(error) if error.kind() != std::io::ErrorKind::NotFound => {
            eprintln!("could not clear the WebView2 session: {error}");
        }
        _ => {}
    }
}

#[tauri::command]
fn content_message(app: tauri::AppHandle, message: Value) {
    bridge::handle_content_message(&app, &message);
}

#[tauri::command]
async fn bridge_call(app: tauri::AppHandle, method: String, params: Value) -> error::Result<Value> {
    commands::dispatch(app, method, params).await
}

/// Where the site webview starts: right of the app's own columns, below its header bar.
pub fn set_site_inset(app: &tauri::AppHandle, left: u32, top: u32, bottom: u32) {
    CHROME_WIDTH.store(left.max(1), Ordering::Relaxed);
    SITE_TOP.store(top, Ordering::Relaxed);
    SITE_BOTTOM.store(bottom, Ordering::Relaxed);
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
    let site_y = f64::from(SITE_TOP.load(Ordering::Relaxed)).min(size.height);

    // The chrome always covers the whole window, and the site is laid on top of it, inset.
    // That is what lets one bar run the full width above both: a webview is a rectangle, so
    // an L-shaped chrome column is not available — but an overlap is. The sites are created
    // after the chrome and therefore sit above it; everything the chrome paints under a
    // visible site is simply covered.
    if let Some(chrome) = app.get_webview("chrome") {
        let _ = chrome.set_position(LogicalPosition::new(0.0, 0.0));
        let _ = chrome.set_size(LogicalSize::new(size.width, size.height));
    }

    // Sized and placed against the inset rather than against what is on screen now: a site
    // parked off to the side must keep the rectangle it will come back at, or it reflows on
    // the way in.
    let site_width = (size.width - site_x).max(1.0);
    let site_bottom = f64::from(SITE_BOTTOM.load(Ordering::Relaxed));
    let site_height = (size.height - site_y - site_bottom).max(1.0);
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
        let _ = site.set_size(LogicalSize::new(site_width, site_height));
        let _ = site.set_position(LogicalPosition::new(x, site_y));
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
                probes: state::Probes::default(),
                site: std::sync::Mutex::new(state::SiteInfo::default()),
                pending_update: std::sync::Mutex::new(None),
            });

            if !app.state::<AppState>().settings.get().persist_session {
                clear_webview_session(app.handle());
            }

            let window = WindowBuilder::new(app, "main")
                // The version belongs where a person looks for it when reporting something,
                // and the title bar is the one place that is true in every window state.
                .title(concat!("CleanMyPosts ", env!("CARGO_PKG_VERSION")))
                .inner_size(1200.0, 800.0)
                .build()?;

            // Before the size is read: every child webview below is positioned against it,
            // and a window that grows after they are placed leaves them at the old rectangle.
            let _ = window.restore_state(WINDOW_STATE_FLAGS);

            // WebView2 fills a surface with white until the page paints into it. That is a
            // blink in a packaged build, where the page is a prerendered file, and the whole
            // of Vite's cold start under `tauri dev` — several seconds of white glare on a
            // dark theme. The UI refines this to the preset's exact colour once it is up;
            // this is only about what fills the surface before there is a page to ask.
            let base = startup_background(&window, &app.state::<AppState>().settings.get().theme);
            let _ = window.set_background_color(Some(base));

            let scale = window.scale_factor()?;
            let size = window.inner_size()?.to_logical::<f64>(scale);

            // The app's own UI first, and full width to start with, matching SITE_HIDDEN:
            // the app opens on Overview. Building it before anything else is what puts
            // something on screen — its page is a local prerendered file, so it paints as
            // soon as it exists.
            window.add_child(
                WebviewBuilder::new("chrome", WebviewUrl::default()).background_color(base),
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
            let auto_consent = app.state::<AppState>().settings.get().auto_consent;
            let site_window = window.clone();
            let _ = window.run_on_main_thread(move || {
                for (label, url) in SITE_WEBVIEWS {
                    let built = site_window.add_child(
                        WebviewBuilder::new(
                            label,
                            WebviewUrl::External(url.parse().expect("static url")),
                        )
                        .initialization_script_for_all_frames(site_init_script(auto_consent)),
                        LogicalPosition::new(size.width, f64::from(DEFAULT_HEADER_HEIGHT)),
                        LogicalSize::new(
                            size.width - f64::from(DEFAULT_CHROME_WIDTH),
                            size.height - f64::from(DEFAULT_HEADER_HEIGHT),
                        ),
                    );
                    match built {
                        // Opt-in, because it is the only way to watch the injected engine when
                        // the ipc channel is itself what broke: nothing the page prints can
                        // reach the app's own log in that case.
                        #[allow(unused_variables)]
                        Ok(webview) =>
                        {
                            #[cfg(debug_assertions)]
                            if std::env::var_os("CMP_DEVTOOLS").is_some() {
                                webview.open_devtools();
                            }
                        }
                        Err(error) => eprintln!("could not create the {label} webview: {error}"),
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
