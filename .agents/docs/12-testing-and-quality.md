# Testing and Quality

## Where each test belongs

| Level               | Tool                               | Covers                                                    |
|---------------------|------------------------------------|-----------------------------------------------------------|
| Engine modules      | Vitest + happy-dom + fixtures      | selectors, click loops, retry conditions, stop detection  |
| Stores, bridge client | Vitest                           | state transitions, error paths, `requestId` correlation   |
| Components, views   | Vitest + Testing Library           | idle/running/done/error states, confirmation dialog       |
| Host logic          | `cargo test`                       | URL building, handle sanitising, settings round-trip, log buffer, timestamp shape |

## The tests this project actually needs

Three places decide whether the app is trustworthy:

1. **Engine against fixtures.** For each delete action, a trimmed, anonymized DOM snapshot of
   the real page under `__fixtures__/`. When the platform changes its markup, the test breaks
   — not the user mid-deletion.
2. **Host URL building.** `target_url` decides which page a run lands on; `show*` and
   `delete*` must agree, and an unknown pair must have no target at all.
3. **Settings serialisation.** The UI validates against camelCase Zod schemas, so a rename
   on the Rust side would break the contract silently rather than at compile time.

## What is not tested

No E2E tests against live platforms. They need real accounts, delete real data, and fail
whenever a platform changes something — which the fixture test catches earlier and more
reliably.

There is no automated check that the Rust `dispatch` arms and the methods in `contract.ts`
still line up; the C# host had one and it has not been replaced.

`cargo fmt --check` and `cargo clippy -- -D warnings` are CI gates: a warning is something
to fix, not to live with.

## CI

On every push and PR to `main`, two jobs: `ui` runs `npm run check` · `npm test` ·
`npm run test:e2e`; `tauri` runs `npm run build` · `cargo fmt --check` · `cargo clippy` ·
`cargo test`.

The Playwright e2e suite drives the built content script against static DOM fixtures in a
real Chromium, stubbing the host by collecting `chrome.webview.postMessage` calls. It is
host-agnostic by construction, which makes it the regression net for any change to the host
or the shell UI.

`main` is protected, direct pushes are blocked, the build status must be green.
Branches: `feature/<name>`, `fix/<name>`, `release/vX.Y.Z`.

## Logging

A ring buffer in the host feeds the log view and is streamed live via the `log` push event.
Three levels: `info`, `warning`, `error`.

Logged: action start and end with counts, each item failure with a reason, login status
changes, retry counts, page reloads.

**Never logged:** post content, user handles, cookies, URLs with tokens. The log must be
safe to copy into a bug report.
