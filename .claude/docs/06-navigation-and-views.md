# Navigation and Views

## Sidebar

```
CleanMyPosts                     (word mark, in the title-bar strip)

X                        •       (• = connection dot)
├── Posts
├── Replies
├── Reposts
├── Likes
└── Following

YouTube                  •
├── Comments
└── Likes

Log                              (only when showLogs is on)

[ running-action bar ]           (only while a deletion runs)
─────────────────────────
Settings                         (footer)
```

## Routing

SvelteKit's file-based router, running as an SPA (`ssr = false`, `adapter-static` with an
`index.html` fallback). One route per nav key:

| Route       | Renders                                                              |
|-------------|----------------------------------------------------------------------|
| `/`         | redirects to `/settings`                                             |
| `/x`        | nothing — the site webview covers the content area; the panel is subnav |
| `/youtube`  | nothing — same                                                       |
| `/log`      | `LogView`                                                            |
| `/settings` | `SettingsView`                                                       |

The window has no address bar, so the URL is an internal detail; it exists because the router
needs one, not because anyone reads it.

**Routing unmounts the page it leaves.** State the user would be annoyed to lose therefore
lives in a store: `LogStore` owns the log's message and level filters for exactly this
reason. Scroll position is not preserved — the log re-arms follow-to-bottom on mount.

`activeKey` is derived from `page.url.pathname`, never held separately. The per-platform action
(Posts, Likes, Comments, …) is not a route — it is chosen within the platform panel's
`ActionRow`s. `x` / `youtube` also drive the site (`site.hide` + `site.navigate`); `log` /
`settings` render in the content area.

## Platform panels (X and YouTube)

`XView` / `YouTubeView` are thin declarations: each lists its action groups and hands them to
the shared `views/platform-panel.svelte`. Adding a platform means adding a list, not a view.

They render **as the `subnav` snippet of `SidebarShell`** — indented under the active X /
YouTube nav item while the sidebar is expanded. Each action is one `ActionRow`.

**Idle**
- "Show" (list icon) → `site.navigate`, opens the correct page in the SiteWebView.
- "Delete" (trash icon) → `site.runAction`.
- Both are disabled until `loginStore.loggedIn[platform]` is true (a `siteLogin` push) and
  while any action is running; a "Sign in to …" hint is shown when not logged in.
- If `confirmDeletion` is true, an alert dialog is shown before the RPC is sent. Because the
  sidebar lives in the narrow ChromeWebView, the panel hides the site while its dialog is
  open (an `$effect` on `confirmOpen`) so the dialog centers over the whole window, then
  restores the site. It has to stay an effect: the dialog also closes itself on Esc.

**Running**
- The row that is deleting is marked with the accent tint.
- `RunStatus` appears above the sidebar footer: label, running count, an indeterminate
  progress bar, and Stop.
- The `ActionRunner` lives in the layout, not in the panel, so progress stays visible after
  the user navigates to Settings or Log.
- On `done`/`error` a toast reports the count or the failure.

## Log view

A terminal-style list: newest last, monospace, one line per entry. Entries arrive via `log`
push events; the host also pushes the buffered log on first load via `log.getBuffer`.

- Header summarises warning and error counts as badges, and carries a text filter, level
  filters, and Clear.
- Auto-follows the tail, but stops following as soon as the user scrolls up — a "Jump to
  latest" button re-arms it. Reading history must not be yanked away by incoming lines.
- Errors get a faint destructive tint; levels are also written out as text, so level is never
  conveyed by colour alone.
- There is no column sorting. A log is read in arrival order; filtering covers the rest.

## Settings view

See [09-feature-settings.md](09-feature-settings.md).

## Shell

- The sidebar (chrome webview, column 0) is always visible. The content area (column 1) is a
  **content host that swaps**: a sidebar click on X or YouTube shows the site webview
  (`site.hide = false`); a click on a Svelte page (Settings, Log) hides it and stretches the
  chrome webview over the whole window (`site.hide = true`). See
  [01-architecture.md](01-architecture.md) for the off-screen-parking mechanics.
- The sidebar width toggles between 240px (expanded) and 56px (icon rail) via
  `layout.setSidebarExpanded`.
- The 40px strip at the top of the web UI holds the word mark and sits below the system
  title bar. Keep it free of controls so the two read as one.
- The log view is always reachable without interrupting a running action.
