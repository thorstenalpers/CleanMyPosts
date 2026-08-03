# Roadmap

Every phase ends in a state you can demo. A phase is done when all acceptance criteria are
met — not when the code is written.

Phases 1–4 shipped as v2.1.4. Phase 6 is the current work.

## Phase 1 — Scaffold _(done)_

Desktop shell with two WebView2 controls, Vite dual build (chrome + content), chrome bridge
with Zod contract and mock, sidebar navigation, log view, settings, CI.

## Phase 2 — Delete on YouTube _(done)_

Content script for `deleteComments` and `deleteLikes`, YouTube navigation and login
detection, progress push events, retry-across-reloads loop.

## Phase 3 — Delete on X _(done)_

Content script for `deletePosts`, `deleteReplies`, `deleteReposts`, `deleteLikes`,
`deleteFollowing`. Username detection.

## Phase 4 — Polish and release _(done)_

Installer (Inno Setup), auto-updater feed, confirmation dialog, theme toggle, sidebar
collapse, persistent log, about section with version and links.

## Phase 5 — UI rebuild _(done)_

Merged platform panels, app-wide run status, grouped settings with visible descriptions,
terminal-style log, configurable theme and accent colour.

## Phase 6 — Tauri host _(current)_

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
- [x] Window geometry survives a restart, via `tauri-plugin-window-state` (size, position and
      maximized only — a window restored hidden or undecorated cannot be recovered from).
- [x] The updater `pubkey` in `tauri.conf.json` is the real one. See
      [12-testing-and-quality.md](12-testing-and-quality.md) for rotation.
- [ ] A release built from it updates an installed app — unproven until `Deploy Release`
      has run once with the `TAURI_SIGNING_PRIVATE_KEY` secret in place.

## Phase 7 — Navigation rework _(done)_

Overview as the landing page, Settings moved to `/settings`, and the platform actions taken
out of the sidebar into a panel of their own beside it so the nav items stop moving under
the pointer. The nav item toggles that panel open and shut, so its width is only spent while
it is in use.

One site webview per platform, both alive for the whole session: a shared one had to be
re-navigated on every switch, which discarded the page the user was on.
`layout.setSidebarExpanded` became `layout.setChromeWidth` — the host stores what the UI
reports instead of guessing how it is composed.

## What is deliberately deferred

- MSIX packaging — it would force a signing certificate into the release pipeline.
- Additional platforms (Reddit, Mastodon, GitHub), only if a new platform genuinely costs
  only an engine module and a list in `$lib/actions.ts`.

## Known gaps

- Half the assistant's round trip is unproven. The **local** source works end to end —
  `assistant::cli::tests::answers_from_the_real_cli` runs a prompt through the real binary
  and is ignored by default because it spends a turn of the developer's own account. The
  **hosted** side has never made a request: no provider key has been set, so nothing has
  exercised a dialect, a key header, or the error-scrubbing path against a live endpoint.
  Their bodies and envelopes are unit-tested against fixtures.
- The strict CSP is only proven to compile. Tauri's nonce tokens are in the binary, but no
  one has watched the app run under it.
- `.agents/skills/` and `.claude/skills/` are still byte-identical committed copies. Both are
  vendored from `skills-lock.json`, so neither is hand-edited.
