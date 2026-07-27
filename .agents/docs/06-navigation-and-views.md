# Navigation and Views

## Sidebar

```
🐦 X
├── Posts
├── Reposts
├── Replies
├── Likes
└── Following

▶ YouTube
├── Comments
└── Liked Videos

📋 Log

⚙ Settings
```

## Routing

No router package. `App.svelte` holds an `activeKey` state and switches the content area via
an `{#if}` chain. For a desktop app with a fixed sidebar there are no URLs, no deep links, no
browser history — a router is ballast.

`activeKey` is one nav key: `'x' | 'youtube' | 'log' | 'settings'`. The per-platform action
(Posts, Likes, Comments, …) is not a route — it is chosen within the platform view's
`ActionRow`s. `x` / `youtube` also drive the site (`site.hide` + `site.navigate`); `log` /
`settings` render in the content area.

## Platform views (X and YouTube)

`XView` / `YouTubeView` render **as the `subnav` snippet of `SidebarShell`** — indented
under the active X / YouTube nav item while the sidebar is expanded. Each action is one
`ActionRow` (e.g. Posts, Replies, …; Comments, Likes). Every action has two states:
**idle** and **running**.

**Idle state**
- One "Show" button (list icon) → `site.navigate`, opens the correct page in the SiteWebView.
- One "Delete" button (trash icon) → `site.runAction`.
- Both are disabled until `loginStore.loggedIn[platform]` is true (a `siteLogin` push) and
  while any action is running; a "Sign in to …" hint is shown when not logged in.
- If `confirmDeletion` is true, an alert dialog is shown before the RPC is sent. Because the
  sidebar lives in the narrow ChromeWebView, each view hides the site while its dialog is
  open (`site.hide` on `confirmOpen`) so the dialog centers over the whole window, then
  restores the site.

**Running state**
- Progress counter (items deleted so far), sourced from `progress` push events.
- "Stop" is not available mid-run (the content script runs to completion or error).
- After `done`/`error`, the result count or error message is shown inline.

## Log view

A scrollable list of log entries. Entries arrive via `log` push events; the host also
pushes the buffered log on first load via `log.getBuffer`. Levels: info (default),
warning (yellow), error (red). Auto-scrolls to the bottom while new lines arrive.

## Settings view

See [09-feature-settings.md](09-feature-settings.md).

## Shell

- The sidebar (ChromeWebView, column 0) is always visible. The content area (column 1) is a
  **ContentHost that swaps**: a sidebar click on X or YouTube shows the SiteWebView browser
  (`site.hide = false`); a click on a Svelte page (Settings, Log) hides the browser and
  expands the ChromeWebView over column 1 to show that page (`site.hide = true`). See
  [01-architecture.md](01-architecture.md) for the `ColumnSpan` / `Visibility` mechanics.
- The sidebar width toggles between 240px (expanded) and 56px (icon rail) via
  `layout.setSidebarExpanded`; the state is persisted in settings.
- While a delete action is running, a thin progress indicator is shown persistently so the
  user can move to another view without losing visibility of the running action.
- The log view is always reachable without interrupting a running action.
