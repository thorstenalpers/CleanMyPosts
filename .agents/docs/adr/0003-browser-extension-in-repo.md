# ADR 0003 — The browser extension lives in this repository, on its own version line

- **Status:** Accepted
- **Date:** 2026-08-12

## Context

The delete engine in `src/lib/engine/` never knew it was running inside the app. It is
bridge-free by rule, it reports through one function, and it drives a foreign document it has
no host-side help with. That makes a Chrome/Firefox extension a transport swap rather than a
port: one call site in `dom.ts` reached `window.chrome.webview`, and nothing else in ~4,300
lines had an opinion about where it ran.

The question was therefore not whether to build one, but where to keep it — and, once it is
kept somewhere, how it gets a version and a release without disturbing the app's.

X and YouTube move their DOM constantly. Every selector in the engine is a standing bet on
markup somebody else controls, and the repository already carries a third consumer of it (the
standalone console scripts) that exists specifically because a hand-maintained second copy had
drifted: a selector fixed in the app stayed broken in the file people had downloaded.

## Decision

**Keep the extension in this repository**, under `extension/`, importing `$lib/engine/`
directly. One more Vite output next to the app and the standalone scripts, built by
`scripts/build-extension.mjs` — no workspaces, no published package, no monorepo tooling.

**Version it separately from the app.** The extension starts at `0.1.0` while the app is at
`3.4.0`, and the two never have to agree.

|                  | App                                          | Extension                     |
| ---------------- | -------------------------------------------- | ----------------------------- |
| Version lives in | `src-tauri/tauri.conf.json` (+ `Cargo.toml`) | `extension/manifest.json`     |
| Tag              | `v3.4.0`                                     | `ext-v0.1.0`                  |
| Release notes    | `release-notes/v3.4.0.md`                    | `release-notes/ext-v0.1.0.md` |
| Workflow         | `deploy-release.yml`                         | `deploy-extension.yml`        |
| Marked latest    | yes                                          | **no**                        |

`make_latest: false` on the extension release is load-bearing. The desktop updater polls
`releases/latest/download/latest.json`; an extension release taking that spot leaves every
installed app unable to find an update, silently and for as long as nobody notices.

Version numbers follow what the stores allow rather than full semver: Chrome accepts one to
four dot-separated integers and nothing else, so `0.2.0-beta.1` is not a version the extension
can ever have. Prereleases get their own integer group (`0.2.0.1`) or no release at all.

## Consequences

**Good**

- A selector fix lands in the app, the standalone scripts and both extensions in one commit.
  This is the entire reason for the decision and it is worth the rest of the list.
- The engine's test suite already covers the extension's behaviour; there is nothing to
  duplicate and no second CI pipeline for the shared part.
- An engine change that breaks the extension breaks it in the same PR, not weeks later in
  another repository nobody re-ran.

**Bad / accepted**

- `targetUrl` in `extension/src/background.ts` duplicates `target_url` in
  `src-tauri/src/commands/site.rs`. The host's copy is Rust and cannot be imported; a page
  added to one has to be added to the other by hand.
- The extension API types are hand-written in `extension/src/browser.ts` rather than taken
  from `@types/chrome`. That package declares the extension namespace globally, which
  TypeScript then intersects into `window.chrome` — a name `src/lib/bridge/webview2.d.ts`
  already owns as WebView2's one-property object. Adopting it broke the engine and a dozen of
  its tests over a global nothing on this side needed.
- The root `tsconfig.json` now pins its own `include`, replicated from the generated
  `.svelte-kit/tsconfig.json`, because setting `include` replaces the inherited one wholesale
  and `extension/` would otherwise never be typechecked. A SvelteKit upgrade that adds an
  entry there needs it copied across.
- Two release processes in one repository, and a tag namespace that has to be read carefully.

**Unresolved**

- Neither store has been approached. An extension that clicks through x.com on the user's
  behalf runs into the platform's rules on automation, which the desktop app's WebView2 route
  sidesteps by not being distributed through anybody's store. Acceptance is unproven, and the
  build is loadable-unpacked until it is not.

## Alternatives considered

- **A separate repository.** Independent release cadence and a clean CI story, paid for with
  either a published `@cleanmyposts/engine` package — versioning, publishing and a lag between
  a fix and the extension that consumes it — or a copy that drifts. The standalone scripts
  already demonstrated which of those two actually happens.
- **npm workspaces.** Would make the sharing explicit, at the cost of restructuring a repo
  whose flat `src/` + `src-tauri/` layout works, to solve a problem a path alias solves.
- **One version number for app and extension.** Ties a store review to a desktop release and
  forces a version bump on one for a change in the other. The two ship through entirely
  different channels at entirely different speeds.
