# Roadmap

Every phase ends in a state you can demo. A phase is done when all acceptance criteria are
met — not when the code is written.

## Phase 1 — Scaffold

WPF shell with two WebView2 controls, Vite dual build (chrome + content), chrome bridge
with Zod contract and mock, sidebar navigation, log view, settings, Storybook, CI.

**Acceptance**
- The app starts and shows the sidebar with all sections.
- `npm run dev` runs fully in the browser against the mock bridge.
- The contract-sync test is green (bridge methods exist on both TypeScript and C# sides).
- Storybook shows the sidebar and the settings form in light and dark, a11y with no
  violations.
- CI builds host, UI, and Storybook.

## Phase 2 — Delete on YouTube

Content script for `deleteComments` and `deleteLikes`, YouTube navigation and login
detection, progress push events, retry-across-reloads loop.

**Acceptance**
- Comments are actually deleted on a test account; count is correct.
- The retry loop runs until `isEmpty()` returns true.
- Failed pages show a count and reason in the log.
- Engine tests run against fixtures, not the live page.

## Phase 3 — Delete on X

Content script for `deletePosts`, `deleteReplies`, `deleteReposts`, `deleteLikes`,
`deleteFollowing`. Username detection.

**Acceptance**
- All five actions delete on a test account; count correct for each.
- Conservative wait times are the default; a run over 500 items on a test account does
  not trigger a suspension.
- Engine tests run against fixtures.

## Phase 4 — Polish and release

Installer (Inno Setup), auto-updater feed, confirmation dialog, theme toggle, sidebar
collapse, persistent log, about dialog with version and links.

**Acceptance**
- Installer installs and uninstalls cleanly.
- Auto-updater detects a new version and offers the update.
- All settings persist across restarts.
- Confirmation dialog appears when `confirmDeletion` is true.

## What is deliberately deferred

- Installer and auto-update until Phase 4 — nothing to distribute before that.
- Additional platforms (Reddit, Mastodon, GitHub) after Phase 4, only if a new platform
  genuinely costs only an engine module and a view.
