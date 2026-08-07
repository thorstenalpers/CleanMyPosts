# CleanMyPosts

A Windows desktop app that bulk-deletes posts, reposts, replies, likes, and followings on
X (formerly Twitter), and comments and liked videos on YouTube, by driving an embedded
WebView2 browser with injected JavaScript.

## The core approach

**No platform APIs are used.** Two WebView2 webviews do all the work:

- **chrome webview** — hosts the Svelte app UI, served by Tauri from the local bundle. The
  user controls everything from here.
- **site webview** — an embedded browser where X and YouTube load. A TypeScript content
  script is registered once (as an initialization script) and survives every subsequent page
  navigation. It exposes `window.__cmp` and does the actual clicking, confirming, and
  retrying on the live site.

The Rust host orchestrates: navigate to the correct URL, call `window.__cmp.run(platform,
action, params)`, relay progress push events to the chrome UI. The retry loop itself runs
in the page. No DOM parsing on the host side. Nothing off a platform page is ever stored.

## Language

All documentation, comments, and diagram labels are written in **English**.

## Stack

| Layer     | Technology                                                                              |
| --------- | --------------------------------------------------------------------------------------- |
| Host      | Tauri 2 (Rust) in `src-tauri/`, WebView2                                                |
| UI        | SvelteKit (prerendered, `adapter-static`), Svelte 5, TypeScript                         |
| UI kit    | shadcn-svelte (`new-york`, `neutral`), Tailwind v4                                      |
| Contracts | Zod — one source for types and runtime validation                                       |
| Tests     | `cargo test` (host), Vitest + happy-dom + Testing Library (UI), Playwright (engine e2e) |

No native UI toolkit: the host window is nothing but child webviews. Everything visible is
Svelte, and the chrome page is prerendered, so the sidebar is in the HTML the webview
receives and paints before any script has run — there is no skeleton because there is no gap
for one to fill.

Two Vite build targets: `chrome` (the SvelteKit app, prerendered to `build/` by
`adapter-static` and served by Tauri) and `content` (injected script; a single IIFE that sets
`window.__cmp`, built by its own `vite.content.config.ts` and never touched by the SvelteKit
plugin). The content bundle is compiled into the host binary with `include_str!`, so the
installed app carries no loose script tree.

## Commands

```bash
npm run start        # the app itself, in the Tauri window
npm run dev          # UI only, in a browser, against the mock host
npm run build
npm run lint
npm run check
npm run test
npm run test:e2e
npm run app:build    # NSIS installer + updater artifacts
cargo test --manifest-path src-tauri/Cargo.toml
```

`npm run build` has to run before anything touches the Rust crate: `include_str!` needs
`dist/content/content.js` to exist before cargo can parse the crate at all.

**Changing anything in `src-tauri/icons/` needs a forced rebuild.** `tauri_build` only
declares `tauri.conf.json` as an input, so cargo sees no reason to re-embed the icon and the
binary keeps the old one — silently, with a successful build:

```bash
cargo clean -p cleanmyposts && cargo build --manifest-path src-tauri/Cargo.toml
```

## Hard rules

1. **No platform API.** No OAuth and no platform token, ever — deletion is browser automation
   and stays that way. The one credential the app knows about is an optional **assistant** API
   key for a hosted model, which has nothing to do with X or YouTube and never touches them.
   It lives in the Windows Credential Manager, never in a file this app owns, and it cannot be
   read back into the UI.
2. **No user data stored.** No SQLite, no database, and none of the user's posts, likes, comments,
   or account content is ever written to disk or cached. The only files written are the app's own
   `settings.json` (theme, log visibility, confirmation, timeouts, assistant source) and
   `.window-state.json` (size, position, maximized). The log buffer is in memory only. The login
   session lives solely in the WebView2 profile (cookies, which the platform manages).
3. **Nothing is written next to the executable.** Every runtime path comes from Tauri's
   `app_config_dir`/`app_local_data_dir` (`%AppData%\com.thorstenalpers.cleanmyposts`,
   `%LocalAppData%\com.thorstenalpers.cleanmyposts`). An installed app cannot write to its
   own directory.
4. **All UI ↔ host communication goes through the bridge.** Two distinct protocols, never
   mixed: [02-bridge-contract.md](.agents/docs/02-bridge-contract.md).
5. **No telemetry.** No analytics, no crash reporting, nothing the user did not ask for. Beyond
   the sites the user opens, the app talks to exactly two kinds of host, both on request: the
   update endpoint, and — only when the user picks a hosted assistant provider and only when
   they press Ask — that provider. What goes with a question is the log and a fixed description
   of the app, nothing else. The default assistant source is the local `claude` binary, which
   sends nothing from here at all.
6. **Content script modules in `src/lib/engine/` have no knowledge of the chrome bridge**
   and import nothing from `src/lib/components/`. They run inside a foreign document.
7. **Components in `src/lib/components/` are bridge-free** (props in, events out) so they can
   be tested without a host. Views are the seam that talks to the bridge. See
   [11-frontend-conventions.md](.agents/docs/11-frontend-conventions.md).
8. **Deletion is slow and is allowed to be.** Configurable waits between actions are the only
   brake against platform automation detection. Never remove them.

## Code style

- Rust: `cargo fmt` and `cargo clippy -- -D warnings` are both CI gates.
- Frontend: `npm run lint` is prettier plus eslint, and is a CI gate. Run `npm run format`
  rather than hand-formatting.
- State lives in `src/lib/stores/*.svelte.ts` as Svelte 5 runes classes — kept as classes
  rather than plain objects because each one owns a bridge subscription.
- TypeScript: no `any`, Zod schemas as the type source, selectors as named constants at
  the top of each engine module.
- Comments only when the _why_ is non-obvious. Never describe what the code does.
- No features, abstractions, or error handling beyond what the task needs.

## Documentation

Read selectively, not all of it.

| When you work on …           | read                                                                  |
| ---------------------------- | --------------------------------------------------------------------- |
| Product decisions, UX flow   | [00-product-vision.md](.agents/docs/00-product-vision.md)             |
| Projects, layers, WebView2   | [01-architecture.md](.agents/docs/01-architecture.md)                 |
| Bridge, RPC, push events     | [02-bridge-contract.md](.agents/docs/02-bridge-contract.md)           |
| Content script, selectors    | [04-content-script.md](.agents/docs/04-content-script.md)             |
| Sidebar, routing, views      | [06-navigation-and-views.md](.agents/docs/06-navigation-and-views.md) |
| Delete features per platform | [08-feature-delete.md](.agents/docs/08-feature-delete.md)             |
| Settings view                | [09-feature-settings.md](.agents/docs/09-feature-settings.md)         |
| Assistant, providers, keys   | [15-feature-assistant.md](.agents/docs/15-feature-assistant.md)       |
| Colors, typography, tokens   | [10-design-system.md](.agents/docs/10-design-system.md)               |
| Svelte rules                 | [11-frontend-conventions.md](.agents/docs/11-frontend-conventions.md) |
| Tests, CI, logging           | [12-testing-and-quality.md](.agents/docs/12-testing-and-quality.md)   |
| Privacy, threat model        | [13-security-and-privacy.md](.agents/docs/13-security-and-privacy.md) |
| Order, acceptance criteria   | [14-roadmap.md](.agents/docs/14-roadmap.md)                           |
| Why a decision was made      | [adr/](.agents/docs/adr/)                                             |
