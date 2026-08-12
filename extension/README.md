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

**Chrome** — `chrome://extensions`, turn on Developer mode, *Load unpacked*, pick
`dist/extension/chrome`.

**Firefox** — `about:debugging#/runtime/this-firefox`, *Load Temporary Add-on*, pick
`dist/extension/firefox/manifest.json`. Temporary add-ons are gone on restart.

## How a run works

The background worker does what the Rust host does in the app: read the handle off the page,
build the target url, drive the tab to it, and ask the content script to run. The retry loop
is not in the worker — it runs in the page, which is what makes MV3 stopping the worker
mid-run harmless. Every progress report wakes it up again.

Stopping reloads the tab. The engine has no way to interrupt a run, so taking the page away is
what ends it, the same way closing the tab ends a standalone script.

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
