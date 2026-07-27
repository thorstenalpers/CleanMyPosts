# CleanMyPosts

A Windows desktop app that bulk-deletes posts, reposts, replies, likes, and followings on
X (formerly Twitter), and comments and liked videos on YouTube, by driving an embedded
WebView2 browser with injected JavaScript.

## The core approach

**No platform APIs are used.** Two WebView2 controls do all the work:

- **ChromeWebView** — hosts the Svelte app UI, served from `cleanmyposts.local`. The user
  controls everything from here.
- **SiteWebView** — an embedded browser where X and YouTube load. A TypeScript content
  script is injected once (via `AddScriptToExecuteOnDocumentCreatedAsync`) and survives every
  subsequent page navigation. It exposes `window.__cmp` and does the actual clicking,
  confirming, and retrying on the live site.

The C# host orchestrates: navigate to the correct URL, call `window.__cmp.run(platform,
action, params)`, relay progress push events to the chrome UI, reload and retry until the
page is empty. No DOM parsing on the host side. No local storage of any kind.

## Language

All documentation, comments, and diagram labels are written in **English**.

## Stack

| Layer    | Technology                                                |
|----------|-----------------------------------------------------------|
| Host     | .NET 10, WPF, WebView2, CommunityToolkit.Mvvm, Serilog   |
| UI       | Svelte 5 + Vite (no SvelteKit), TypeScript                |
| UI kit   | shadcn-svelte (`new-york`, `neutral`), Tailwind v4        |
| Contracts| Zod — one source for types and runtime validation         |
| Docs     | Storybook 10 (`addon-svelte-csf`, `addon-a11y`)           |
| Tests    | xUnit (host), Vitest + happy-dom + Testing Library (UI)   |

Two Vite build targets: `chrome` (app UI at `cleanmyposts.local`) and `content` (injected
script; a single IIFE that sets `window.__cmp`).

## Commands

```bash
dotnet build CleanMyPosts.slnx -c Release
dotnet test src/Tests/Tests.csproj -c Release --filter "TestCategory!=Long-Running"
npm --prefix src/CleanMyPosts.UI run dev
npm --prefix src/CleanMyPosts.UI run build
npm --prefix src/CleanMyPosts.UI run test
npm --prefix src/CleanMyPosts.UI run storybook
```

## Hard rules

1. **No platform API.** No OAuth, no token storage, no API key.
2. **No local storage.** No SQLite, no files written to disk, no user data cached.
   The session lives only in the WebView2 user profile (cookies, which the platform manages).
3. **All UI ↔ host communication goes through the bridge.** Two distinct protocols, never
   mixed: [02-bridge-contract.md](.agents/docs/02-bridge-contract.md).
4. **No telemetry.** No outbound traffic other than to the sites the user opens themselves.
5. **Content script modules in `src/lib/engine/` have no knowledge of the chrome bridge**
   and import nothing from `src/lib/components/`. They run inside a foreign document.
6. **Every component in `src/lib/components/` has a `.stories.svelte`** and is bridge-free
   (props in, events out) so it can render in Storybook without a host. This includes the
   sidebar/navbar. See [11-frontend-conventions.md](.agents/docs/11-frontend-conventions.md).
7. **Deletion is slow and is allowed to be.** Configurable waits between actions are the only
   brake against platform automation detection. Never remove them.

## Code style

- C#: Microsoft conventions, `var` when the type is obvious, expression bodies, primary
  constructors, `is null`, `_camelCase` fields, no `#region`.
- TypeScript: no `any`, Zod schemas as the type source, selectors as named constants at
  the top of each engine module.
- Comments only when the *why* is non-obvious. Never describe what the code does.
- No features, abstractions, or error handling beyond what the task needs.

## Documentation

Read selectively, not all of it.

| When you work on …              | read                                                                                   |
|---------------------------------|----------------------------------------------------------------------------------------|
| Product decisions, UX flow      | [00-product-vision.md](.agents/docs/00-product-vision.md)                              |
| Projects, layers, WebView2      | [01-architecture.md](.agents/docs/01-architecture.md)                                  |
| Bridge, RPC, push events        | [02-bridge-contract.md](.agents/docs/02-bridge-contract.md)                            |
| Content script, selectors       | [04-content-script.md](.agents/docs/04-content-script.md)                              |
| Sidebar, routing, views         | [06-navigation-and-views.md](.agents/docs/06-navigation-and-views.md)                  |
| Delete features per platform    | [08-feature-delete.md](.agents/docs/08-feature-delete.md)                              |
| Settings view                   | [09-feature-settings.md](.agents/docs/09-feature-settings.md)                          |
| Colors, typography, tokens      | [10-design-system.md](.agents/docs/10-design-system.md)                                |
| Svelte rules                    | [11-frontend-conventions.md](.agents/docs/11-frontend-conventions.md)                  |
| Tests, CI, logging              | [12-testing-and-quality.md](.agents/docs/12-testing-and-quality.md)                    |
| Privacy, threat model           | [13-security-and-privacy.md](.agents/docs/13-security-and-privacy.md)                  |
| Order, acceptance criteria      | [14-roadmap.md](.agents/docs/14-roadmap.md)                                            |
