# ADR 0002 — Tauri 2 instead of .NET for the host

- **Status:** Accepted
- **Date:** 2026-08-01
- **Supersedes:** [0001](0001-winui3-host.md)

## Context

ADR 0001 moved the host from WPF to WinUI 3 and its reasoning still holds for what it
compared: within .NET, WinUI 3 was the right place to host WebView2. What it did not
question was .NET itself.

The host does three things: own a window, position two webviews, and pass JSON between the
Svelte UI and the platform pages. Everything that makes this app what it is — the delete
engine, the selectors, the retry loops, the entire UI — is TypeScript. Against that, the
WinUI 3 host cost a ~100 MB self-contained Windows App SDK payload in every install, a
`net10.0-windows` toolchain for anyone building from source, and a second language to keep
tested.

## Decision

Replace the host with Tauri 2 (`src-tauri`) and delete the .NET host,
its xUnit project, the solution, and the Inno Setup installer.

Supporting decisions taken with it:

- **The engine keeps speaking WebView2.** The injected script shims
  `chrome.webview.postMessage` onto Tauri's `invoke`, so `src/lib/engine/**`, the bridge
  contract, the stores, and all their tests are unchanged. The host swap is invisible above
  `tauri-host.ts`.
- **Two child webviews in one window**, positioned by hand on resize, rather than a webview
  per window. It reproduces the column model the .NET host had.
- **NSIS plus the updater plugin** instead of Inno Setup plus AutoUpdater.NET. `tauri build`
  emits the installer, the signature, and the artifacts the updater endpoint expects.
- **The content bundle is compiled in** with `include_str!`, keeping the property that
  nothing loose sits next to the executable.

## Consequences

**Good**

- One language for everything above the window: the host is ~1000 lines of Rust with no
  UI framework, no XAML, and no DI container.
- The Windows App SDK payload is gone; the app is an exe plus its resources on the WebView2
  runtime that ships with Windows.
- Signed updater artifacts come out of the release build instead of a hand-maintained feed.
- `cargo fmt`, `cargo clippy -D warnings`, and `cargo test` replace the .NET analyzer and
  test setup at a fraction of the CI time.

**Bad / accepted**

- Features the .NET host had are not back yet: window geometry is not restored, there is no
  startup skeleton, and there is no Mica backdrop or custom title bar. Tracked in
  [14-roadmap.md](14-roadmap.md).
- The xUnit test that compared `contract.ts` against the registered handlers is gone, and
  nothing checks host/UI contract drift now. The `accentColor` gap that used to exist in the Rust
  `AppSettings` is exactly the kind of drift it used to catch.
- Building from source now needs the Rust toolchain, and `npm run build` has to run before
  cargo can parse the crate at all — `include_str!` resolves at compile time.
- Cargo compiles a fresh unsigned binary per build script. Smart App Control blocks unknown
  unsigned binaries under some paths, which surfaces as `os error 4551` or a missing
  `OUT_DIR` file rather than anything resembling a code problem. Building from a tree
  outside the repo is the workaround; moving only `CARGO_TARGET_DIR` is not enough.

## Alternatives considered

- **Stay on WinUI 3.** Nothing was broken; the cost was the payload, the toolchain, and a
  second language. The migration was cheap for the same reason ADR 0001's was: the host has
  almost no logic in it.
- **Electron.** Would ship a second browser engine into an app whose entire job is driving
  the one Windows already has.
- **A plain Win32/WebView2 shell in Rust without Tauri.** Removes the framework but also
  the installer, the updater, and the multi-webview plumbing — all of which would then be
  hand-written.
