# Architecture

## Core principle

The C# host owns the process, the windows, and the WebView2 lifecycle. Everything visible
and every platform interaction is TypeScript.

| Responsibility                        | C# host | TypeScript |
|---------------------------------------|---------|------------|
| Windows, WebView2 lifecycle           | ✓       |            |
| URL construction, retry loop          | ✓       |            |
| Navigation of the site WebView        | ✓       |            |
| Progress relay to the chrome UI       | ✓       |            |
| App UI                                |         | ✓          |
| DOM interaction on the platform site  |         | ✓          |
| Deletion click/confirm/retry          |         | ✓          |

The host never touches a platform API and never parses the DOM itself. It only navigates,
calls `window.__cmp.run()`, and relays what comes back.

## Shell composition

The window (`ShellWindow.xaml`) is a two-column `Grid` holding exactly two WebView2 controls:

```
MainWindow (WPF Grid)
├── column 0 (240px) ── ChromeWebView ── Svelte app: the Sidebar
└── column 1 (*) ────── ContentHost, one visible at a time:
    ├── SiteWebView ────── x.com / youtube.com + injected __cmp   (X / YouTube)
    └── ChromeWebView ──── Svelte pages (expanded over column 1)  (Settings)
```

**ChromeWebView** (`IChromeWebViewService`) — the Svelte app, served from
`cleanmyposts.local/index.html`. It always renders the **Sidebar** in column 0 (240px). For
Settings it also fills column 1: the shell sets `Grid.ColumnSpan = 2` so the chrome WebView
stretches across the whole window and the site WebView is hidden behind it.

**SiteWebView** (`ISiteWebViewService`) — the embedded browser where the user is logged in to
X and YouTube, in column 1. The content script IIFE is registered once via
`AddScriptToExecuteOnDocumentCreatedAsync` and survives every navigation without re-injection.
The host calls `ExecuteScriptAsync` to invoke `window.__cmp`; the script posts back via
`chrome.webview.postMessage`.

**The ContentHost swaps, it does not split.** A sidebar click on X or YouTube shows the site
browser (`site.hide = false` → `SiteWebView.Visibility = Visible`, chrome `ColumnSpan = 1`).
A click on Settings hides the browser (`site.hide = true` → `Visibility = Hidden`, chrome
`ColumnSpan = 2`) and the Svelte page fills the window. The sidebar itself is always the
chrome WebView in column 0; its width toggles 240px ↔ 56px via `layout.setSidebarExpanded`.

Both WebViews share the same WebView2 user-data directory so login sessions persist across
app restarts.

## Projects

```
CleanMyPosts.slnx
src/
├── CleanMyPosts/                 # WPF host
│   ├── Bridge/                   # HostBridge, registrar, handlers, DTOs
│   │   ├── Handlers/             # SettingsBridgeHandlers, SiteBridgeHandlers, …
│   │   └── Dtos/                 # ContentScriptDtos, SiteDtos, SettingsDtos, …
│   ├── Services/                 # SiteActionOrchestrator, ChromeWebViewService,
│   │   │                         #   SiteWebViewService, UserSettingsService, …
│   └── Views/                    # ShellWindow.xaml (minimal: two WebView2s, layout)
├── CleanMyPosts.UI/              # Svelte 5 + Vite
│   ├── src/lib/bridge/           # client.ts, contract.ts, mock.ts
│   ├── src/lib/engine/           # content script: protocol.ts, dom.ts, x/, youtube/
│   ├── src/lib/components/       # app components + ui/ (shadcn-svelte)
│   ├── src/lib/stores/           # Svelte 5 runes stores
│   ├── src/views/                # XView, YouTubeView, LogView, SettingsView
│   ├── src/main.ts               # chrome build entry
│   └── src/content-entry.ts      # content build entry (sets window.__cmp)
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
