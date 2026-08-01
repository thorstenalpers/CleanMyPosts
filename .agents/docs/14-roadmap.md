# Roadmap

Every phase ends in a state you can demo. A phase is done when all acceptance criteria are
met — not when the code is written.

Phases 1–4 shipped as v2.1.4. Phase 5 is the current work.

## Phase 1 — Scaffold *(done)*

Desktop shell with two WebView2 controls, Vite dual build (chrome + content), chrome bridge
with Zod contract and mock, sidebar navigation, log view, settings, Storybook, CI.

## Phase 2 — Delete on YouTube *(done)*

Content script for `deleteComments` and `deleteLikes`, YouTube navigation and login
detection, progress push events, retry-across-reloads loop.

## Phase 3 — Delete on X *(done)*

Content script for `deletePosts`, `deleteReplies`, `deleteReposts`, `deleteLikes`,
`deleteFollowing`. Username detection.

## Phase 4 — Polish and release *(done)*

Installer (Inno Setup), auto-updater feed, confirmation dialog, theme toggle, sidebar
collapse, persistent log, about section with version and links.

## Phase 5 — WinUI 3 host and UI rebuild *(current)*

Move the host off WPF and rebuild the UI around it. See
[adr/0001-winui3-host.md](adr/0001-winui3-host.md) for the decision and its trade-offs.

**Scope**
- WinUI 3 / Windows App SDK host, unpackaged and self-contained; Mica backdrop and an
  extended title bar.
- Web assets compiled into the assembly; nothing written next to the executable.
- Static start-up skeleton that only clears once the UI reports `app.ready`.
- Configurable theme *and* accent colour, applied to both the web UI and the window chrome.
- UI rebuilt: merged platform panels, app-wide run status, grouped settings with visible
  descriptions, terminal-style log.
- `System.Text.Json` throughout; nullable reference types on; zero build warnings.

**Acceptance**
- [x] Host builds and runs with zero warnings; all xUnit and Vitest tests green.
- [x] Window geometry, theme, and accent survive a restart.
- [x] Publish folder has no `wwwroot/`/`Scripts/`; a run leaves no `*.WebView2` folder beside
      the executable.
- [x] The skeleton clears only after the first real view is rendered.
- [ ] Installer built from the new publish output installs and uninstalls cleanly.
- [ ] The installed app starts on a machine without the Windows App SDK.

## What is deliberately deferred

- MSIX packaging — it would break the AutoUpdater.NET flow and force a signing certificate
  into the release pipeline.
- `PublishSingleFile` — not supported for self-contained WinUI 3.
- Additional platforms (Reddit, Mastodon, GitHub), only if a new platform genuinely costs
  only an engine module and a list in a view.

## Known gaps

- Mica is enabled on the window, but WebView2 paints opaque, so the backdrop is not visible
  through the app content. Tracked in [10-design-system.md](10-design-system.md).
