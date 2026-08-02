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

| Method                      | Params                                      | Result                          |
| --------------------------- | ------------------------------------------- | ------------------------------- |
| `app.getInfo`               | —                                           | `{ version, homepageUrl, … }`   |
| `settings.get`              | —                                           | `AppSettings`                   |
| `settings.set`              | `AppSettings`                               | —                               |
| `site.navigate`             | `{ platform, action }`                      | `{ ok: boolean }`               |
| `site.runAction`            | `{ requestId, platform, action, timeouts }` | `{ deletedCount }`              |
| `site.reload`               | —                                           | —                               |
| `site.hide`                 | `{ hide: boolean }`                         | —                               |
| `layout.setSidebarExpanded` | `{ expanded: boolean }`                     | —                               |
| `updater.checkForUpdates`   | —                                           | `{ updateAvailable, message? }` |
| `system.openUrl`            | `{ url }`                                   | —                               |
| `system.openLicense`        | —                                           | —                               |
| `log.getBuffer`             | —                                           | `LogEntry[]`                    |

**The caller mints `requestId`** for `site.runAction`. Push events outlive the RPC
round-trip and must be attributable to their trigger.

`site.hide` and `layout.setSidebarExpanded` drive the shell layout: the first parks the
site webview off-screen and stretches the chrome webview over the window, the second
toggles the sidebar column between 240px and 56px. See
[01-architecture.md](01-architecture.md).

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
	showLogs: boolean;
	confirmDeletion: boolean;
	accentColor: string; // '#RRGGBB'
	useSystemAccent: boolean; // follow the Windows accent colour
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
