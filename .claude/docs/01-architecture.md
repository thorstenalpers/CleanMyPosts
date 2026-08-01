# Architecture

## Core principle

The C# host owns the process, the window, and the WebView2 lifecycle. Everything visible
and every platform interaction is TypeScript.

| Responsibility                        | C# host | TypeScript |
|---------------------------------------|---------|------------|
| Window, WebView2 lifecycle            | ✓       |            |
| URL construction, retry loop          | ✓       |            |
| Navigation of the site WebView        | ✓       |            |
| Progress relay to the chrome UI       | ✓       |            |
| App UI                                |         | ✓          |
| DOM interaction on the platform site  |         | ✓          |
| Deletion click/confirm/retry          |         | ✓          |

The host never touches a platform API and never parses the DOM itself. It only navigates,
calls `window.__cmp.run()`, and relays what comes back.

## Host platform

WinUI 3 (Windows App SDK), **unpackaged** and self-contained: no MSIX, no runtime install,
distribution stays an Inno Setup installer plus the AutoUpdater.NET feed. `WindowsPackageType`
is `None` and `WindowsAppSDKSelfContained` is on, so the app runs on a machine without the
Windows App SDK installed. Minimum OS is Windows 10 build 19041.

There is no MVVM framework, no XAML resource dictionary, and no bindings. `ShellWindow.xaml`
is roughly 50 lines: a grid, two WebView2 controls, a title-bar drag region, and a skeleton
layer. See [adr/0001-winui3-host.md](adr/0001-winui3-host.md) for why.

## Shell composition

```
ShellWindow (WinUI 3 Window, Mica backdrop, extended title bar)
└── RootGrid
    ├── content grid
    │   ├── column 0 (240px) ── ChromeWebView ── Svelte app: sidebar (+ pages when spanned)
    │   ├── column 1 (*) ────── SiteWebView ──── x.com / youtube.com + injected __cmp
    │   └── DragRegion ──────── 40px strip over column 0, registered via SetTitleBar
    └── SkeletonLayer ───────── static placeholder until the UI reports app.ready
```

**ChromeWebView** (`IChromeWebViewService`) — the Svelte app on `cleanmyposts.local`. It
always renders the sidebar in column 0. For Settings and Log it also fills column 1: the
shell sets `Grid.ColumnSpan = 2` so the chrome WebView stretches across the whole window.

**SiteWebView** (`ISiteWebViewService`) — the embedded browser where the user is logged in
to X and YouTube. The content script IIFE is registered once via
`AddScriptToExecuteOnDocumentCreatedAsync` and survives every navigation without
re-injection. The host calls `ExecuteScriptAsync` to invoke `window.__cmp`; the script posts
back via `chrome.webview.postMessage`.

**Hiding the site view uses opacity, not visibility.** A collapsed WebView2 stops rendering
and would never finish the background sign-in load that makes the X username available
before the user first opens X. `Hide(true)` sets `Opacity = 0` and `IsHitTestVisible = false`.

Both WebViews share one `CoreWebView2Environment` (`WebView2EnvironmentProvider`), so they
share a single browser process and one profile — login sessions persist across restarts.

## Web assets are embedded

The Vite output is compiled into the host assembly as embedded resources under the logical
prefix `WebAssets/` (see the `AddWebAssets` target in `CleanMyPosts.csproj`). `WebAssetProvider`
serves them, and `ChromeWebViewService` answers `WebResourceRequested` for
`https://cleanmyposts.local/*` from that provider instead of mapping a folder.

Consequence: the publish folder contains no `wwwroot/` and no `Scripts/`, and the app cannot
be broken by someone editing loose files next to the executable.

## Runtime paths

Everything the app writes goes through `Hosting/AppPaths.cs`:

| Path                                        | Contents                          |
|---------------------------------------------|-----------------------------------|
| `%LocalAppData%\CleanMyPosts\Configurations` | `AppProperties.json`, `WindowSettings.json`, `timeoutSettings.json` |
| `%LocalAppData%\CleanMyPosts\Logs`           | Rolling Serilog files             |
| `%LocalAppData%\CleanMyPosts\WebView2`       | WebView2 profile (cookies, session) |

`WEBVIEW2_USER_DATA_FOLDER` is set in the `App` constructor before any XAML is realised.
Without it WebView2 falls back to a `<exe>.WebView2` folder next to the executable, which an
installed app cannot write to.

## Startup sequence

1. `App.OnLaunched` builds the generic host and starts it.
2. `ApplicationHostService` loads settings, then activates `ShellWindow`.
3. The window restores its bounds from `WindowSettings.json`, applies theme and title-bar
   colours, and shows `SkeletonLayer` — a static placeholder, no animation.
4. `RootGrid.Loaded` initialises the chrome WebView first, then the site WebView (which
   loads x.com hidden in the background), and registers the bridge handlers.
5. The Svelte app mounts, loads settings and log, and calls `app.ready`.
6. The host collapses `SkeletonLayer`. A 15 s timer drops it anyway if `app.ready` never
   arrives, so a frontend failure cannot leave the app looking hung.

Shutdown runs the other way: `AppWindow.Closing` cancels the close, saves the window bounds,
stops the host and flushes Serilog, then closes for real.

## Projects

```
CleanMyPosts.slnx
src/
├── CleanMyPosts/                 # WinUI 3 host
│   ├── Hosting/                  # App wiring: AppPaths, AppConfig, HostService, FileService
│   ├── Infrastructure/           # HostBridge, registrar, WebView services, WebAssetProvider
│   ├── Settings/                 # UserSettingsService, DTOs, settings bridge handlers
│   ├── Sites/                    # SiteActionOrchestrator, site bridge handlers
│   ├── Logging/                  # Ring buffer + Serilog sink
│   ├── Updater/                  # AutoUpdater.NET wiring, update prompt handler
│   └── Views/                    # ShellWindow.xaml (two WebView2s, drag region, skeleton)
├── CleanMyPosts.UI/              # Svelte 5 + Vite
│   ├── src/lib/bridge/           # client.ts, contract.ts, mock.ts
│   ├── src/lib/engine/           # content script: protocol.ts, dom.ts, x/, youtube/
│   ├── src/lib/components/       # app components + ui/ (shadcn-svelte)
│   ├── src/lib/stores/           # Svelte 5 runes stores
│   ├── src/lib/theme/            # accent colour → OKLCH tokens
│   ├── src/views/                # XView, YouTubeView, LogView, SettingsView
│   ├── src/main.ts               # chrome build entry
│   ├── src/content-entry.ts      # content build entry (sets window.__cmp)
│   └── e2e/                      # Playwright specs against DOM fixtures
└── Tests/                        # xUnit
```

## SiteActionOrchestrator

The orchestrator owns everything that must survive a page reload:

1. Build the target URL for the requested `(platform, action)` pair.
2. Navigate the SiteWebView and wait for `NavigationCompleted`.
3. Detect login: call `window.__cmp.getUserName()` or `getLoginStatus()`.
4. Call `window.__cmp.run(platform, action, paramsJson)`.
5. Await the `done` or `error` message from the content script.
6. If items remain (`isEmpty` returns false), reload and go to step 4 — up to
   `MaxRetriesPerAction` consecutive rounds without progress.
7. Push a `progress` event to the chrome UI after each content-script progress message,
   accumulating the count across reloads.

## Dependency rules

- `src/lib/components/**` does not import the bridge. Props in, events out.
- `src/lib/engine/**` has no knowledge of the chrome bridge and no imports from
  `src/lib/components/**`. It must be self-contained — it runs in a foreign document.
- `src/views/**` reads stores; it does not call bridge methods directly.
- The host knows no DOM selectors. It only knows which `(platform, action)` to run.

## Adding a platform

1. `src/lib/engine/<platform>/` — one module per delete action, each exporting a
   `ContentActionDefinition`.
2. Register in `engine/protocol.ts` and `bridge/contract.ts`.
3. A view under `src/views/` and a sidebar entry.
4. URL builder case in `SiteActionOrchestrator.BuildUrlAsync`.

No existing code changes for this — if it requires them, the abstraction needs rework.
