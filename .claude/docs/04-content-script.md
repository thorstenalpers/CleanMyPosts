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
  isEmpty(): boolean;                        // nothing left on this page
  run(params: RunParams): Promise<number>;   // click/confirm/retry loop; returns count
}
```

```ts
interface RunParams {
  requestId: string;
  waitAfterDelete: number;
  waitBetweenRetryDeleteAttempts: number;
  userName?: string;   // X only
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

## Error handling

A failed click is normal operation, not an exception. Failures are counted, not thrown. An
unhandled exception from `run` posts an `error` message and ends the run.

The retry loop lives here, in the page: `run` keeps going until it can no longer find an
item to act on. The host does not poll `isEmpty` and does not reload between rounds —
`isEmpty` is part of the protocol but nothing calls it across the bridge.

## URL map

The host builds the target URL before navigating, using the platform and action:

| Platform | Action                           | URL                                                      |
|----------|----------------------------------|----------------------------------------------------------|
| X        | posts                            | `https://x.com/search?q=from%3A{user}&src=typed_query`  |
| X        | replies                          | `https://x.com/{user}/with_replies`                      |
| X        | reposts                          | `https://x.com/{user}`                                   |
| X        | likes                            | `https://x.com/{user}/likes`                             |
| X        | following                        | `https://x.com/{user}/following`                         |
| YouTube  | comments                         | `https://myactivity.google.com/page?hl=en&page=youtube_comments` |
| YouTube  | likes                            | `https://www.youtube.com/playlist?list=LL`               |
