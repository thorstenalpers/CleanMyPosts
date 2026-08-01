use serde_json::Value;
use tauri::{
    webview::WebviewBuilder, window::WindowBuilder, Emitter, LogicalPosition, LogicalSize, Manager,
    WebviewUrl, WindowEvent,
};

const SIDEBAR_WIDTH: f64 = 240.0;

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
}})();"#,
        engine = CONTENT_SCRIPT
    )
}

#[tauri::command]
fn content_message(app: tauri::AppHandle, message: Value) {
    let _ = app.emit_to("chrome", "content-message", message);
}

fn layout_webviews(app: &tauri::AppHandle, sidebar_width: f64) {
    let Some(window) = app.get_window("main") else {
        return;
    };
    let (Ok(scale), Ok(size)) = (window.scale_factor(), window.inner_size()) else {
        return;
    };
    let size = size.to_logical::<f64>(scale);

    if let Some(chrome) = app.get_webview("chrome") {
        let _ = chrome.set_position(LogicalPosition::new(0.0, 0.0));
        let _ = chrome.set_size(LogicalSize::new(sidebar_width, size.height));
    }
    if let Some(site) = app.get_webview("site") {
        let _ = site.set_position(LogicalPosition::new(sidebar_width, 0.0));
        let _ = site.set_size(LogicalSize::new(
            (size.width - sidebar_width).max(0.0),
            size.height,
        ));
    }
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![content_message])
        .setup(|app| {
            let window = WindowBuilder::new(app, "main")
                .title("CleanMyPosts")
                .inner_size(1200.0, 800.0)
                .build()?;

            let scale = window.scale_factor()?;
            let size = window.inner_size()?.to_logical::<f64>(scale);

            window.add_child(
                WebviewBuilder::new("chrome", WebviewUrl::default()),
                LogicalPosition::new(0.0, 0.0),
                LogicalSize::new(SIDEBAR_WIDTH, size.height),
            )?;

            window.add_child(
                WebviewBuilder::new(
                    "site",
                    WebviewUrl::External("https://x.com".parse().expect("static url")),
                )
                .initialization_script_for_all_frames(site_init_script()),
                LogicalPosition::new(SIDEBAR_WIDTH, 0.0),
                LogicalSize::new(size.width - SIDEBAR_WIDTH, size.height),
            )?;

            let handle = app.handle().clone();
            window.on_window_event(move |event| {
                if matches!(event, WindowEvent::Resized(_)) {
                    layout_webviews(&handle, SIDEBAR_WIDTH);
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running CleanMyPosts");
}
