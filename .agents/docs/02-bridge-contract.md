# Bridge Contract

There are **two** protocols. They are never mixed.

| Protocol         | File                         | Between                | Transport                                        |
| ---------------- | ---------------------------- | ---------------------- | ------------------------------------------------ |
| Chrome bridge    | `src/lib/bridge/contract.ts` | Svelte app ↔ host      | `invoke('bridge_call')` in, `cmp-push` event out |
| Content protocol | `src/lib/engine/protocol.ts` | host ↔ injected script | `eval` in, `postMessage` out                     |

## Chrome bridge

Zod is the single source: types **and** runtime validation come from the same schemas.
Every method lives in a central `BridgeMethods` map. A handler without an entry does not
exist. `dispatch` in `src-tauri/src/commands/` has a matching arm per method; nothing
currently checks that the two lists agree, so adding a method means touching both by hand.

`tauri-host.ts` adapts Tauri's `invoke` and event channel to the `{ id, ok, result }`
envelope `BridgeClient` already speaks, which is why the client, the schemas, and the stores
never learned that the host changed.

**Request** (UI → host)

```ts
{ id: string, method: string, params: unknown }
```

**Response** (host → UI, discriminated on `ok`)

```ts
{ id, ok: true,  result: unknown }
{ id, ok: false, error: { message: string, code?: string } }
```

### RPC methods

| Method                    | Params                                      | Result                          |
| ------------------------- | ------------------------------------------- | ------------------------------- |
| `app.getInfo`             | —                                           | `{ version, homepageUrl, … }`   |
| `settings.get`            | —                                           | `AppSettings`                   |
| `settings.set`            | `AppSettings`                               | —                               |
| `site.navigate`           | `{ platform, action }`                      | `{ ok: boolean }`               |
| `site.runAction`          | `{ requestId, platform, action, timeouts }` | `{ deletedCount }`              |
| `site.reload`             | —                                           | —                               |
| `site.hide`               | `{ hide: boolean }`                         | —                               |
| `site.show`               | `{ platform }`                              | —                               |
| `layout.setChromeWidth`   | `{ width }`                                 | —                               |
| `layout.setBackground`    | `{ color: '#RRGGBB' }`                      | —                               |
| `updater.checkForUpdates` | —                                           | `{ updateAvailable, message? }` |
| `system.openUrl`          | `{ url }`                                   | —                               |
| `system.openLicense`      | —                                           | —                               |
| `log.getBuffer`           | —                                           | `LogEntry[]`                    |

**The caller mints `requestId`** for `site.runAction`. Push events outlive the RPC
round-trip and must be attributable to their trigger.

`site.show`, `site.hide` and `layout.setChromeWidth` drive the shell layout. `site.show`
brings a platform's webview forward, `site.hide` parks every site webview off-screen and
stretches the chrome webview over the window, and `setChromeWidth` sets the chrome column
to whatever the UI currently fills it with. The host does not know how the UI is composed —
the layout adds up the sidebar (240px or 56px) and the action panel (224px, only while it is
open) and reports the sum. The site column starts where the chrome ends.
See [01-architecture.md](01-architecture.md).

`layout.setBackground` exists for one reason: resizing a webview exposes pixels the page has
not drawn into yet, and WebView2 fills those with black until it catches up — a band that
flashes as the action panel opens. The UI hands the host the colour the shell is about to
paint, so the gap is invisible instead. The colour is **rasterised, not parsed**: the
computed value is `oklch(…)` and so is what canvas reports from `fillStyle`, so the UI draws
one pixel and reads it back to get sRGB bytes.

**`site.show` is not `site.navigate`.** Showing a platform must never load a URL: each
platform's webview keeps its page for the whole session, and re-navigating it on every
visit is the same as discarding it. Only the Show and Delete actions navigate.

### Push events (host → UI, no request)

| Event             | Payload                                 | Purpose                              |
| ----------------- | --------------------------------------- | ------------------------------------ |
| `progress`        | `{ requestId, deletedCount, message? }` | items deleted so far in a run        |
| `log`             | `{ timestamp, level, message }`         | a line for the log view              |
| `settingsChanged` | `AppSettings`                           | settings changed from another source |
| `siteLogin`       | `{ platform, loggedIn }`                | login status detected                |

### Actions

```ts
type XAction =
	| 'showPosts'
	| 'deletePosts'
	| 'showReplies'
	| 'deleteReplies'
	| 'showReposts'
	| 'deleteReposts'
	| 'showLikes'
	| 'deleteLikes'
	| 'showFollowing'
	| 'deleteFollowing';

type YouTubeAction = 'showComments' | 'deleteComments' | 'showLikes' | 'deleteLikes';
```

`show*` actions navigate the site webview to the correct URL and return `{ ok }`.
`delete*` actions navigate and then start a run; the retry loop itself is in the page.

### Settings

```ts
type AppSettings = {
	theme: 'Default' | 'Light' | 'Dark';
	language: 'System' | 'en' | 'de';
	showIntro: boolean;
	showLogs: boolean;
	showX: boolean;
	showYouTube: boolean;
	confirmDeletion: boolean;
	themePreset: 'Default' | 'Claude' | 'Cosmic' | 'Supabase' | 'Graphite';
	timeouts: {
		waitAfterDelete: number; // ms between individual deletions
		waitBetweenRetryDeleteAttempts: number;
		waitAfterDocumentLoad: number;
	};
};
```

## Content protocol

The injected script exposes exactly one global. It has no other connection to the app.

```ts
interface CmpApi {
	run(platform: Platform, action: Action, paramsJson: string): void;
	isEmpty(platform: Platform, action: Action): boolean;
	getUserName(): string; // X only — returns '' when not logged in
	getLoginStatus(): string; // YouTube only — returns 'logged_in' or ''
}
declare const window: { __cmp?: CmpApi };
```

`run` is fire-and-forget. Progress, completion, and errors all come back asynchronously
via `chrome.webview.postMessage`:

```ts
{ type: 'log',      level: 'info'|'warning'|'error', message: string }
{ type: 'progress', requestId: string, deletedCount: number, message?: string }
{ type: 'done',     requestId: string, deletedCount: number }
{ type: 'error',    requestId: string, message: string }
```

The host never polls. One round-trip per tick was the performance problem in CleanMyPosts
v1 — do not reintroduce it.

## Mock

`src/lib/bridge/mock.ts` implements the chrome bridge fully in the browser so that
`npm run dev` and all component tests run without a host. A new bridge method requires an
entry in `contract.ts`, an arm in `dispatch`, **and** a stub in `mock.ts`.
