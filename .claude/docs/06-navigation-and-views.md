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

No router package. `App.svelte` holds an `activeKey` state and switches the content area by
hiding pages, not by swapping them. For a desktop app with a fixed sidebar there are no URLs,
no deep links, no browser history — a router is ballast.

Both content-area pages stay mounted; the inactive one is `invisible` and `inert`. Unmounting
would reset its filters, level selection and scroll offset every time the user looks at
something else, which is the behaviour a SPA is expected *not* to have. `visibility` rather
than `display`, because a `display:none` subtree drops its layout and with it the scroll
offset.

`activeKey` is one nav key: `'x' | 'youtube' | 'log' | 'settings'`. The per-platform action
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
- The `ActionRunner` lives in `App.svelte`, not in the panel, so progress stays visible after
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

- The sidebar (ChromeWebView, column 0) is always visible. The content area (column 1) is a
  **content host that swaps**: a sidebar click on X or YouTube shows the SiteWebView browser
  (`site.hide = false`); a click on a Svelte page (Settings, Log) hides the browser and
  expands the ChromeWebView over column 1 to show that page (`site.hide = true`). See
  [01-architecture.md](01-architecture.md) for the `ColumnSpan` / opacity mechanics.
- The sidebar width toggles between 240px (expanded) and 56px (icon rail) via
  `layout.setSidebarExpanded`.
- The top 40px of the window is the host's title-bar drag region. The strip in the web UI
  that lines up with it holds the word mark and must contain nothing interactive.
- The log view is always reachable without interrupting a running action.
