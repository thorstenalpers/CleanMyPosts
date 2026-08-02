# Roadmap

Every phase ends in a state you can demo. A phase is done when all acceptance criteria are
met — not when the code is written.

Phases 1–4 shipped as v2.1.4. Phase 6 is the current work.

## Phase 1 — Scaffold *(done)*

Desktop shell with two WebView2 controls, Vite dual build (chrome + content), chrome bridge
with Zod contract and mock, sidebar navigation, log view, settings, CI.

## Phase 2 — Delete on YouTube *(done)*

Content script for `deleteComments` and `deleteLikes`, YouTube navigation and login
detection, progress push events, retry-across-reloads loop.

## Phase 3 — Delete on X *(done)*

Content script for `deletePosts`, `deleteReplies`, `deleteReposts`, `deleteLikes`,
`deleteFollowing`. Username detection.

## Phase 4 — Polish and release *(done)*

Installer (Inno Setup), auto-updater feed, confirmation dialog, theme toggle, sidebar
collapse, persistent log, about section with version and links.

## Phase 5 — UI rebuild *(done)*

Merged platform panels, app-wide run status, grouped settings with visible descriptions,
terminal-style log, configurable theme and accent colour.

## Phase 6 — Tauri host *(current)*

Replace the .NET host with a Rust one and delete the old one. See
[adr/0002-tauri-host.md](adr/0002-tauri-host.md) for the decision and its trade-offs;
[adr/0001-winui3-host.md](adr/0001-winui3-host.md) is the record it supersedes.

**Scope**
- Tauri 2 host: one window, two child webviews, layout driven from the UI.
- Content script compiled into the binary; nothing written next to the executable.
- NSIS installer and signed updater artifacts from `tauri build`.
- The engine, the bridge contract, and their tests stay untouched — the host swap is
  invisible above `tauri-host.ts`.

**Acceptance**
- [x] `cargo test`, Vitest, and the Playwright e2e suite are green.
- [x] Settings survive a restart.
- [x] The installed app carries no loose script tree.
- [x] The C# host, its tests, and the solution are gone.
- [ ] `accentColor` and `useSystemAccent` exist in the Rust `AppSettings`; without them
      `settings.get` fails the UI's Zod validation.
- [ ] Window geometry survives a restart (the .NET host did this, the Rust host does not).
- [ ] The updater `pubkey` in `tauri.conf.json` is the real one, and a release built from
      it updates an installed app.

## What is deliberately deferred

- MSIX packaging — it would force a signing certificate into the release pipeline.
- Additional platforms (Reddit, Mastodon, GitHub), only if a new platform genuinely costs
  only an engine module and a list in a view.

## Known gaps

- No startup skeleton: the window shows the webviews as they load.
