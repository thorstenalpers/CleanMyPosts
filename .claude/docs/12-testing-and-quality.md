# Testing and Quality

## Where each test belongs

| Level               | Tool                               | Covers                                                    |
|---------------------|------------------------------------|-----------------------------------------------------------|
| Engine modules      | Vitest + happy-dom + fixtures      | selectors, click loops, retry conditions, stop detection  |
| Stores, bridge client | Vitest                           | state transitions, error paths, `requestId` correlation   |
| Components, views   | Vitest + Testing Library           | idle/running/done/error states, confirmation dialog       |
| Bridge contract     | Vitest **and** xUnit               | TS and C# sides know exactly the same methods             |
| Host services       | xUnit                              | orchestrator retry logic, URL building, login detection   |

## The tests this project actually needs

Three places decide whether the app is trustworthy:

1. **Engine against fixtures.** For each delete action, a trimmed, anonymized DOM snapshot of
   the real page under `__fixtures__/`. When the platform changes its markup, the test breaks
   — not the user mid-deletion.
2. **Bridge contract sync.** An xUnit test reads method names from `contract.ts` and compares
   them with registered handlers. If either side drifts, the build fails.
3. **Orchestrator retry loop.** Unit tests for `SiteActionOrchestrator`: navigate, call run,
   receive progress, receive done, check isEmpty, reload and repeat. Against a mock
   `ISiteWebViewService`.

## What is not tested

No E2E tests against live platforms. They need real accounts, delete real data, and fail
whenever a platform changes something — which the fixture test catches earlier and more
reliably.

Long-running tests carry `[Trait("TestCategory", "Long-Running")]` and are excluded from CI.

## CI

On every push and PR to `main`: `dotnet build` · `dotnet test` (without Long-Running) ·
`npm run check` · `npm run test` · `npm run build` · `npm run build-storybook`.

The Storybook build is part of CI so a broken story is caught immediately instead of
rotting unnoticed.

`main` is protected, direct pushes are blocked, the build status must be green.
Branches: `feature/<name>`, `fix/<name>`, `release/vX.Y.Z`.

## Logging

A ring buffer in the host feeds the log view and is streamed live via the `log` push event.
Three levels: `info`, `warning`, `error`.

Logged: action start and end with counts, each item failure with a reason, login status
changes, retry counts, page reloads.

**Never logged:** post content, user handles, cookies, URLs with tokens. The log must be
safe to copy into a bug report.
