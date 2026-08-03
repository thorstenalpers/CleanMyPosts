# Architecture

## Core principle

The Rust host owns the process, the window, and the webview lifecycle. Everything visible
and every platform interaction is TypeScript.

| Responsibility                       | Rust host | TypeScript |
| ------------------------------------ | --------- | ---------- |
| Window, webview lifecycle            | ✓         |            |
| URL construction                     | ✓         |            |
| Navigation of the site webview       | ✓         |            |
| Progress relay to the chrome UI      | ✓         |            |
| App UI                               |           | ✓          |
| DOM interaction on the platform site |           | ✓          |
| Deletion click/confirm/retry         |           | ✓          |

The host never touches a platform API and never parses the DOM itself. It only navigates,
calls `window.__cmp.run()`, and relays what comes back.

## Host platform

Tauri 2 on WebView2, bundled as an NSIS installer with the updater plugin's signed
artifacts. There is no native UI toolkit and no packaged runtime: WebView2 ships with
Windows, and the app is a single `cleanmyposts.exe` plus its resources. The one runtime
requirement is WebView2, which is preinstalled on Windows 11 and on current Windows 10.

## Shell composition

```
main window (Tauri)
├── chrome webview ─── column 0 (sidebar 240/56px + action panel 224px) ── Svelte app
├── site-x webview ─── column 1 (rest) ── x.com + injected __cmp
└── site-youtube ───── column 1 (rest) ── youtube.com + injected __cmp
```

**One site webview per platform, both alive for the whole session.** A single shared one
had to be re-navigated on every switch, and re-navigating is the same thing as throwing the
page away — scroll position, opened threads and half-finished logins went with it. Only one
is on screen at a time; the other is parked.

All three webviews are children of one window, positioned by hand in `layout_webviews`
(`lib.rs`) on every resize and on every layout change the UI requests.

**chrome webview** — the SvelteKit app, served from `build/`. It always renders the
sidebar, plus the action panel beside it while one is open. For Overview, Settings and Log
it takes the full window width via `site.hide`. Its width is whatever the UI reports
through `layout.setChromeWidth`; the host stores that number and nothing else.

**site webviews** — the embedded browsers where the user is logged in to X and YouTube,
one per platform. The content-script IIFE is registered with
`initialization_script_for_all_frames` on both, so it survives every navigation without
re-injection. Which one is on screen follows `site.show`; that call moves a webview and
never navigates it.

**A site view that is not on screen is parked off-screen, never resized to zero.** A
zero-sized webview stops laying out, which would reset the platform page's scroll position
every time the user glances at Settings — or at the other platform. Both site views keep
the size they will come back at, so returning to one is a move, not a reflow.

## The engine talks WebView2, the host is Tauri

The delete engine posts through `chrome.webview.postMessage`, which only exists inside
WebView2's own host channel. The init script shims that object onto
`__TAURI__.core.invoke('content_message')`, so the engine — and its tests — stay unaware
that the host changed. The same script guards on the origin: it runs on every top-level
navigation the site webview makes, including anything the user clicks through to.

`eval` has no return channel, so the page reports who is logged in (`siteInfo`) rather than
the host asking for it.

## Web assets

The chrome build is `build/`, which Tauri bundles as the frontend. The content build is
compiled into the binary with `include_str!("../../dist/content/content.js")` — which is why
`npm run build` has to run before cargo can even parse the crate.

Consequence: the installed app carries no loose script tree, and it cannot be broken by
someone editing files next to the executable.

## Runtime paths

| Path                                                       | Contents                                      |
| ---------------------------------------------------------- | --------------------------------------------- |
| `%AppData%\com.thorstenalpers.cleanmyposts\settings.json`  | theme, log visibility, confirmation, timeouts |
| `%LocalAppData%\com.thorstenalpers.cleanmyposts\EBWebView` | WebView2 profile (cookies, session)           |

Both come from Tauri's `app_config_dir` / local data dir. The log buffer is in memory only
(2000 entries, oldest dropped) — nothing is written to disk.

## Startup sequence

1. `run()` builds the Tauri app, loads `settings.json`, and manages `AppState`.
2. The main window is created, then **the chrome webview first** — its page is a local
   prerendered file, so it paints as soon as it exists. The two site webviews are queued
   onto the main thread rather than built inline: constructing an external webview is
   synchronous work and x.com and youtube.com start fetching the moment they exist, which
   held the window empty for seconds when it happened before the UI was up. The layout and
   the site commands already tolerate a webview that does not exist yet.
3. The SvelteKit app mounts on `/` (Overview), loads settings and log, and reports its
   width and site visibility to the host.
4. Resizes re-run `layout_webviews`.

## Projects

```
src/                             # SvelteKit app
├── app.html                     # HTML shell + static start-up placeholder
├── routes/                      # +layout.svelte (shell) + one page per nav key
├── lib/app-context.ts           # bridge + stores handed from layout to pages
├── lib/actions.ts               # the per-platform action groups, shared by panel + overview
├── lib/layout.ts                # sidebar and panel widths, reported to the host
├── lib/bridge/                  # client.ts, contract.ts, tauri-host.ts, mock.ts
├── lib/engine/                  # content script: protocol.ts, dom.ts, x/, youtube/
├── lib/components/              # app components + ui/ (shadcn-svelte)
├── lib/stores/                  # Svelte 5 runes stores
├── lib/i18n/                    # en.ts is the source catalogue, de.ts is typed against it
├── lib/theme/                   # colour presets + the transition-safe theme swap
├── lib/views/                   # OverviewView, XView, YouTubeView, LogView, SettingsView
└── content-entry.ts             # content build entry (sets window.__cmp)
src-tauri/                       # Rust host
├── src/main.rs                  # entry point, calls lib.rs
├── src/lib.rs                   # window + webviews, layout, init script
├── src/commands/                # one module per bridge domain
│   ├── mod.rs                   # the method → function map
│   ├── settings.rs              # settings.get / settings.set
│   ├── site.rs                  # navigate, run, cancel, hide, layout, URL building
│   └── system.rs                # app info, open url/license, updater, log buffer
├── src/bridge.rs                # push events + content-script message routing
├── src/state.rs                 # AppState, in-flight runs, site info
├── src/error.rs                 # serialisable error type
├── src/settings.rs              # settings.json store
├── src/log.rs                   # bounded in-memory log buffer, RFC 3339 stamps
└── capabilities/                # per-webview permissions
e2e/                             # Playwright specs against DOM fixtures
```

## Running an action

`commands/site.rs` owns everything a run needs:

1. `site.navigate` builds the target URL for the requested `(platform, action)` pair and
   assigns it to that platform's site webview. Only the panel's Show and Delete buttons
   trigger this — merely opening a platform never navigates it.
2. `site.runAction` registers the request id in `state::Runs`, then evals
   `window.__cmp.run(platform, action, paramsJson)` in the page.
3. Content-script messages come back through `content_message` into `bridge.rs`: `progress`
   updates the run's count and is forwarded to the UI, `done`/`error` resolves the pending
   call.
4. `site.cancelAction` resolves the call with the count reached so far and reloads the page
   — the engine has no cancellation primitive, so tearing down the page is what actually
   stops its click loop.

The retry-until-empty loop lives in the engine, inside the page. The host does not poll
`isEmpty`.

## Dependency rules

- `src/lib/components/**` does not import the bridge. Props in, events out.
- `src/lib/engine/**` has no knowledge of the chrome bridge and no imports from
  `src/lib/components/**`. It must be self-contained — it runs in a foreign document.
- `src/lib/views/**` reads stores; it does not call bridge methods directly.
- The host knows no DOM selectors. It only knows which `(platform, action)` to run.

## Adding a platform

1. `src/lib/engine/<platform>/` — one module per delete action, each exporting a
   `ContentActionDefinition`.
2. Register in `engine/protocol.ts` and `bridge/contract.ts`.
3. A view under `src/lib/views/` and a sidebar entry.
4. URL builder case in `target_url` (`commands/site.rs`), plus the origin guard in
   `site_init_script` (`lib.rs`).

No existing code changes for this — if it requires them, the abstraction needs rework.
