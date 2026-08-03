# Navigation and Views

## Sidebar and action panel

```
┌──────────────────────┬───────────────────┐
│ ⌸  CleanMyPosts      │ X            ✕    │  ← header: platform, sign-in state, close
│                      │ Signed in         │
│ ⌂ Overview           │                   │
│ 𝕏 X               •  │ Posts      ▤ 🗑   │  ← one ActionRow per group
│ ▶ YouTube         •  │ Replies    ▤ 🗑   │
│ ≡ Log                │ Reposts    ▤ 🗑   │
│ ✦ Assistant          │ Likes      ▤ 🗑   │
│ [ running-action ]   │ Following  ▤ 🗑   │
│ ──────────────────── │                   │
│ ⚙ Settings           │                   │
└──────────────────────┴───────────────────┘
  240px / 56px folded    224px, X + YouTube only
```

- `•` is the connection dot, `[ running-action ]` only while a deletion runs, `Settings` is
  pinned to the footer. X, YouTube, Log and Assistant each appear only while their switch in
  the Navigation settings is on; a route whose item is gone bounces back to the overview, and
  the same guard catches any URL the sidebar does not offer.
- **The actions are a column of their own, not a submenu.** Opening X used to push YouTube
  five rows down and back up again; a column beside the nav leaves every item where the user
  last saw it. That is the whole reason it is not inline.
- **The nav item is a toggle.** First click opens the actions, the next one closes them
  again, and the panel carries its own ✕ as well. Escape closes it, and so does leaving the
  platform. Nothing is open by default — the width is only spent while it is being used.
- **Opening a platform never navigates it.** Each platform has its own site webview that
  stays loaded for the whole session; a sidebar click only calls `site.show`, which moves a
  webview into view. Only the panel's Show and Delete buttons issue `site.navigate`. Site
  visibility is an `$effect` on the route, not a side effect of the click, so it is right
  on start-up and after a back/forward too.

### Hand-off between the two engines

The chrome page and the site webview are painted by different engines, so a route change and
a host relayout land on screen at different moments — which is why opening X used to flash
the outgoing page and the incoming site together. The layout turns that collision into a
sequence: `main` fades out on the route change, and `site.show` is only called once the fade
has had its 140 ms. On the way back `site.hide` fires immediately and the page fades in
behind it. The action panel slides in over the same 150 ms.

The host resize itself is a single step and is not animated — moving a webview in
increments would be one IPC round-trip per frame. It does need
`layout.setBackground`, though: growing the chrome exposes pixels the page has not painted
yet, and WebView2 fills those with black until it catches up.

**Every route is preloaded once the overview is up.** `preloadCode` on all five paths runs
after the stores have loaded, so the first click on any page is a render rather than a chunk
fetch. It is deliberately not part of the first paint — nothing is fetched for a page nobody
has asked for until the visible one has settled.

## Routing

SvelteKit's file-based router. Every route is **prerendered** (`ssr = true`, `prerender = true`,
`adapter-static` without a fallback), so the HTML the webview opens already contains the
shell — the sidebar is on screen before any JavaScript runs. One route per nav key:

| Route       | Renders                                                                 |
| ----------- | ----------------------------------------------------------------------- |
| `/`         | `OverviewView` — the file the webview opens, so it carries the shell    |
| `/x`        | nothing — the site webview covers the content area; the panel is layout |
| `/youtube`  | nothing — same                                                          |
| `/log`      | `LogView`                                                               |
| `/settings` | `SettingsView`                                                          |

The overview sits at `/`, not behind a redirect: the entry point has to be the prerendered
shell. A redirect would put the router — and therefore the JavaScript bundle — in front of
the first paint, which is exactly what prerendering is meant to avoid. The nav key → path
map lives in `+layout.svelte` as `ROUTES`.

## Overview

The landing page is a **summary of state**, not a greeting and not a widget board: which
platforms are signed in, what each one can remove, and whether anything is running right
now. Its per-platform lists come from `$lib/actions.ts` — the same list the action panel is built
from, because a summary that can drift from the buttons is worse than none.

Opening a platform from here goes through `openPlatform` on the app context: routing and
the `site.*` calls that belong with it live in the layout, and a page borrows them rather
than repeating them.

The window has no address bar, so the URL is an internal detail; it exists because the router
needs one, not because anyone reads it.

**Routing unmounts the page it leaves.** State the user would be annoyed to lose therefore
lives in a store: `LogStore` owns the log's message and level filters for exactly this
reason. Scroll position is not preserved — the log re-arms follow-to-bottom on mount.

`activeKey` is derived from `page.url.pathname`, never held separately. The per-platform action
(Posts, Likes, Comments, …) is not a route — it is chosen within the action panel.
`x` / `youtube` also drive the site (`site.show`); `overview` / `log` / `settings` hide it
(`site.hide`) and render in the content area.

## Platform actions (X and YouTube)

`XView` / `YouTubeView` are thin declarations: each names its platform and its action group
list from `$lib/actions.ts`, and hands both to the shared
`$lib/views/platform-panel.svelte`. Adding a platform means adding a list, not a view.

The panel renders as an `<aside aria-label="… actions">` beside the sidebar, one
`ActionRow` per group, 224px wide. It is not a snippet of `SidebarShell` — the sidebar's job
is to keep its items still. It enters with a CSS keyframe rather than a Svelte transition:
the exit cannot be animated without keeping the element alive anyway, and a JS transition
would drag the Web Animations API — which happy-dom does not have — into every component
test that mounts a panel.

> A second shape — a card floating over the platform page — was built and then removed. It
> could not have both of the things it was for. The chrome and the sites are separate
> WebView2 controllers, and a webview cannot be transparent over a sibling: any chrome
> reaching over the site to hold the card became a full-height opaque strip, and everything
> in that strip the card did not cover hid the page. Drawn inside the sidebar column instead
> it covered the navigation rather than the page. Getting both would take a third webview
> sized exactly to the card, with the panel's state pushed across the process boundary —
> more machinery than the rail costs.

**Idle**

- "Show" (list icon) → `site.navigate`, opens the correct page in the SiteWebView.
- "Delete" (trash icon) → `site.runAction`.
- Both are disabled until `loginStore.loggedIn[platform]` is true (a `siteLogin` push) and
  while any action is running; a "Sign in to …" hint is shown when not logged in.
- If `confirmDeletion` is true, an alert dialog is shown before the RPC is sent. Because the
  panel lives in the narrow ChromeWebView, it hides the site while its dialog is
  open (an `$effect` on `confirmOpen`) so the dialog centers over the whole window, then
  restores the site. It has to stay an effect: the dialog also closes itself on Esc.

**Running**

- The row that is deleting is marked with the accent tint.
- `RunStatus` appears above the sidebar footer: label, running count, an indeterminate
  progress bar, and Stop.
- The `ActionRunner` lives in the layout, not in the panel, so progress stays visible after
  the user navigates to Overview, Settings or Log — where there is no panel at all.
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
  **content host that swaps**: X or YouTube brings that platform's site webview forward
  (`site.show`); a Svelte page (Overview, Settings, Log) parks every site webview and
  stretches the chrome webview over the whole window (`site.hide = true`). See
  [01-architecture.md](01-architecture.md) for the off-screen-parking mechanics.
- The chrome column is as wide as what the UI puts in it: the sidebar (240px expanded /
  56px folded) plus the action rail (224px) when one is shown. The numbers live in
  `$lib/layout.ts` and are reported as one sum via `layout.setChromeWidth`.
- The word mark sits in the sidebar header next to the fold toggle. There is no separate
  top strip — the sidebar and the site webview both start at the top edge.
- The log view is always reachable without interrupting a running action.
