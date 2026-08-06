# Content Script

The most fragile part of the project. The injected TypeScript drives the platform's real
web UI to delete the user's content — which means every platform redesign can break it.
Everything here is built on the assumption that this will happen.

## Layout

```
src/lib/engine/
├── protocol.ts          # wire types for host ↔ content-script, no logic
├── dom.ts               # delay, waitForElement, isVisible, postLog/postProgress/postDone/postError
├── types.ts             # ContentActionDefinition
├── content-entry.ts     # registers window.__cmp, routes (platform, action) → definition
├── config.ts            # every selector and word the engine looks for; the patch point
├── consent.ts           # clicks cookie banners away on every page load
├── x/
│   ├── index.ts         # registers all X actions
│   ├── posts.ts
│   ├── replies.ts
│   ├── reposts.ts
│   ├── likes.ts
│   └── following.ts
└── youtube/
    ├── index.ts         # registers all YouTube actions
    ├── comments.ts
    └── likes.ts
```

Each action module exports exactly one object:

```ts
interface ContentActionDefinition {
	isEmpty(): boolean; // nothing left on this page
	run(params: RunParams): Promise<number>; // click/confirm/retry loop; returns count
}
```

```ts
interface RunParams {
	requestId: string;
	waitAfterDelete: number;
	waitBetweenRetryDeleteAttempts: number;
	userName?: string; // X only
}
```

There is no shared base class. The platforms differ enough that forced abstraction would
drag multiple action modules down on every selector break.

## Coding patterns

**Selectors are named constants at the top of the module.** Never inline. When a selector
breaks, the site of the failure is findable in seconds.

**A retry ladder instead of fixed timeouts.** Waiting for UI elements runs through an
increasing delay sequence — fast for the common case, patient enough for slow ones:

```ts
const RETRY_DELAYS_MS = [100, 200, 300, 500, 500, 500, 500, 500, 1000, 1000];
```

**Progress is pushed, not polled.** Call `postProgress(requestId, count)` after each
deleted item. The host never asks.

**Always delete the first matching element, then re-search.** Virtualized lists remove
DOM nodes while you work on them. A pre-collected `NodeList` goes stale. Search fresh
after each delete.

**Stop via failure count and scroll check.** When the loop finds no target, scroll down
and retry. If the scroll position does not change, the list has truly ended — only then
stop. Without this check the engine stops early on lazy-loading lists.

**After each deletion, wait `waitAfterDelete` ms.** This is the only brake against
automation detection. It is exposed in Settings and may be raised by the user.

**Never match on `innerText` where a `data-testid` exists.** Text matching breaks on
language changes. Where only text remains, document the language dependency in the module.

## What the script must handle

- **DOM changes on the platform.** Countermeasure: fixture files with real, trimmed markup;
  Vitest tests run against happy-dom. When the platform changes something, the test breaks
  before the user notices.
- **Automation detection.** Countermeasure: configurable waits, a slow default, no parallel
  actions.
- **Virtualized lists.** See "always delete the first matching element" above.
- **UI language variants.** See `innerText` note above.
- **Cookie banners.** `consent.ts` clicks them away. The script is registered as an
  initialization script, so every navigation starts a fresh 20-second poll that stops at the
  first banner it dismisses. A button only counts inside a container whose own text is about
  cookies — otherwise "OK" on a delete dialog would qualify — and the wording is matched in
  all eleven languages the app is translated into. **A declining button always wins over an
  accepting one**: the goal is to get the bar out of the user's way, not to consent on their
  behalf, and the accept branch only exists for banners that offer nothing else.

## The configuration, and the user's patch

Everything the engine searches for lives in `config.ts` as one mutable object, handed out as
`window.__cmp.config`. Selectors carrying a `data-testid` are the same everywhere; labels and
menu words are not, and neither is a regional variant that ships a different DOM. Those are
what this exists for.

`AppSettings.engineScript` is the user's own patch. The host wraps it in a `try`/`catch` and
evaluates it **inside the page, immediately before each run** — not at page load, so saving a
fix takes effect on the next action rather than the next navigation, and a syntax error in it
costs the run nothing but a warning in the log. A patch is meant to be one line:

```js
window.__cmp.config.youtube.removeFromLikedText.push('beğenilenlerden kaldır');
```

The assistant can write one. Its patch mode puts the current config into the prompt and asks
for runnable JavaScript and nothing else; saving the answer is a separate click by the user,
because this is code that will run inside their signed-in session.

`config.autoConsent` is the cookie-banner switch. It is baked into the initialization script
at webview creation and pushed into already-loaded pages from `settings::set`, because the
watcher is polling while the user flips it.

## Who is signed in

X and YouTube are told apart by the page's own host — one script is injected into both, and
YouTube's avatar heuristic answers nothing on x.com. For X, "signed in" means **the handle is
known**: every X url is built from it, so an account the engine cannot name is of no use. The
handle comes from the profile link, and from the account button when the nav rail does not
render one. A page showing neither reports `unknown` rather than signed out, so a slow render
never reads as a sign-out.

Those three selectors live in `config.ts` with the rest, which makes a `data-testid` X renames
a one-line patch instead of a release. Each change of state is written to the log, so a user
can see whether their sign-in reached the app at all.

## The pointer

`clickWithCursor` moves a marker to the element before clicking it, so a person can follow
what the app is doing on their account. It is an inline SVG ring, not an emoji, and
`content-entry` calls `hideCursor()` in the run's `finally`: a marker left on the page after
the run reads as "still working" long after nothing is.

## Error handling

A failed click is normal operation, not an exception. Failures are counted, not thrown. An
unhandled exception from `run` posts an `error` message and ends the run.

The retry loop lives here, in the page: `run` keeps going until it can no longer find an
item to act on. The host does not poll `isEmpty` and does not reload between rounds —
`isEmpty` is part of the protocol but nothing calls it across the bridge.

## URL map

The host builds the target URL before navigating, using the platform and action:

| Platform | Action    | URL                                                              |
| -------- | --------- | ---------------------------------------------------------------- |
| X        | posts     | `https://x.com/search?q=from%3A{user}&src=typed_query`           |
| X        | replies   | `https://x.com/{user}/with_replies`                              |
| X        | reposts   | `https://x.com/{user}`                                           |
| X        | likes     | `https://x.com/{user}/likes`                                     |
| X        | following | `https://x.com/{user}/following`                                 |
| YouTube  | comments  | `https://myactivity.google.com/page?hl=en&page=youtube_comments` |
| YouTube  | likes     | `https://www.youtube.com/playlist?list=LL`                       |
