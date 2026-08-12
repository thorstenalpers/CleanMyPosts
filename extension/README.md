# CleanMyPosts — browser extension

The same delete engine the desktop app runs, in Chrome and Firefox instead of WebView2.

`src/lib/engine/` is shared, not copied. A selector fixed for the app is fixed here in the
same commit, which is the whole reason this lives in the app's repository rather than its own.

## Build

```bash
npm run build:extension
```

Writes `dist/extension/chrome/` and `dist/extension/firefox/`. The two differ in one file:
Firefox implements MV3 background as an event page rather than a service worker, and refuses
an unsigned build without an add-on id.

## Load it

**Chrome** — `chrome://extensions`, turn on Developer mode, _Load unpacked_, pick
`dist/extension/chrome`.

**Firefox** — `about:debugging#/runtime/this-firefox`, _Load Temporary Add-on_, pick
`dist/extension/firefox/manifest.json`. Temporary add-ons are gone on restart.

## Three scripts, two worlds

| File            | World          | What it is                                            |
| --------------- | -------------- | ----------------------------------------------------- |
| `main-world.js` | the page's own | the engine, and `window.__cmp`                        |
| `content.js`    | isolated       | the only half with `chrome.*`; relays between the two |
| `background.js` | worker         | what the Rust host does in the app                    |

The engine sits in the page's world so `window.__cmp` is the object the console can reach —
patching `__cmp.config` is how a selector gets fixed without a release, and an isolated
`__cmp` is reachable by nobody. It also puts the engine where the desktop app's copy runs, so
a page that behaves for the app behaves here.

The cost is real and deliberate: the page can reach `__cmp` too, and could in principle call
it. The desktop app has always paid it.

The two halves talk over `CustomEvent`s carrying JSON strings (`page-protocol.ts`) — `detail`
is structured-cloned across the world boundary and a string is what survives it. Both scripts
run at `document_idle` in no guaranteed order, so a command that arrives before the engine
does times out after two seconds and hands the retry back to the worker.

**Firefox caveat, unverified:** `world: "MAIN"` in `content_scripts` is a Chrome feature that
Firefox added later, and which release first carries it is not established here. If the
Firefox build reports `the page world did not answer`, that is this — the script loaded into
the isolated world and the bridge has nobody to talk to.

## How a run works

The background worker reads the handle off the page, builds the target url, drives the tab to
it, and asks for the run. The retry loop is not in the worker — it runs in the page, which is
what makes MV3 stopping the worker mid-run harmless. Every progress report wakes it up again.

Stopping reloads the tab. The engine has no way to interrupt a run, so taking the page away is
what ends it, the same way closing the tab ends a standalone script.

## Fixing a selector without a build

Open the console on the platform tab — `__cmp` is right there, the same as in the app:

```js
__cmp.config.youtube.likesPopupClickTargets.unshift('.some-new-class');
__cmp.config.youtube.deleteActivityText.push('sil');
```

The patch holds for that page load. `__cmp.countMatches` and `__cmp.readStructure` answer
over the report channel, so their results appear in the console alongside everything else.

## What is not here yet

- Settings. The waits are the standalone scripts' defaults and cannot be changed from the UI.
- The assistant. It reads an API key out of the Windows Credential Manager, which has no
  extension equivalent, and it is not obvious yet that it should have one.
- Action plans and saved actions.
- Delete everything.

## Before it can ship

Neither store has been approached. An extension that clicks through x.com on the user's behalf
runs into the platform's own rules on automation — the desktop app takes the WebView2 route
partly to stay out of that argument, and this one cannot. Treat store acceptance as unproven.

The listing copy, the permission justifications and what is still missing are in
[store-listing.md](store-listing.md). Screenshots are the blocker: none exist, and neither
store accepts a submission without them.
