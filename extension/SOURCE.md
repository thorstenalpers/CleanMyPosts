# Building this add-on from source

This is what AMO's source code submission asks for. It is written for a reviewer who has this
archive and nothing else.

The uploaded package is produced by Vite, which bundles and minifies, and by the Svelte
compiler, which turns `.svelte` files into JavaScript. Nothing else is generated.

## This archive holds two products

CleanMyPosts is a Windows desktop app and a browser extension, in one repository, sharing the
code that does the deleting. The archive is the whole repository, unstripped — nothing is
filtered out of it, so what a reviewer builds is what the tag holds.

**Only two directories matter for the add-on:**

- `extension/` — the add-on itself
- `src/lib/` — the engine it shares with the desktop app, plus the components the popup uses

`src-tauri/` is the desktop app: Rust, a Tauri host, a Windows installer. **It is not built by
anything below, it needs no toolchain you have to install, and no part of it ends up in the
add-on.** `e2e/`, `release-notes/` and `assets/` are likewise not inputs to the add-on build.

The archive is available two ways, and they hold the same commit:

- The GitHub release for the tag, which carries it automatically:
  `https://github.com/thorstenalpers/CleanMyPosts/archive/refs/tags/ext-<version>.zip`
- Or `git archive --format=zip HEAD` from a checkout of that tag.

GitHub's version puts everything one directory down, named after the repository and tag; run
the commands below from inside it.

## Build environment

|                  |                                                                          |
| ---------------- | ------------------------------------------------------------------------ |
| Operating system | Any that Node runs on. Built and tested on Windows 11 and on Ubuntu (CI) |
| Node.js          | 24.x — install from https://nodejs.org or `nvm install 24`               |
| npm              | 11.x, which ships with Node 24                                           |
| Anything else    | No. No Rust, no Python, no native toolchain.                             |

## Steps

From the root of this archive:

```bash
npm ci
npm run build:extension
```

The result is in `dist/extension/firefox/`, and is byte-for-byte what was uploaded apart from
the source maps: `npm run pack:extension` is what produced the submitted zip, and it leaves
`*.map` out.

To produce the uploaded archive exactly:

```bash
npm ci
npm run pack:extension
```

That writes `dist/extension/cleanmyposts-firefox-<version>.zip`.

`npm ci` rather than `npm install`, deliberately: it installs exactly what `package-lock.json`
pins, so the build is the same one that produced the upload.

## What the build does

`scripts/build-extension.mjs`, in order:

1. Three separate Vite builds, each a single self-contained IIFE — `main-world.js`,
   `content.js`, `background.js`. Separate because a content script cannot import anything, so
   they cannot share a chunk.
2. One Vite build for `popup.html` and its assets.
3. Copies `extension/manifest.json` and the icons from `src-tauri/icons/`.
4. Copies the whole result to `dist/extension/firefox/` and rewrites two manifest fields:
   `background.service_worker` becomes `background.scripts` (Firefox implements MV3 background
   as an event page), and `browser_specific_settings` is added with the add-on id, the minimum
   versions, and `data_collection_permissions: { required: ["none"] }`.

Chrome's output and Firefox's differ in that one file and nothing else.

## Where the code is

The add-on is thin. Almost all of it is the delete engine, which the desktop app in this
repository runs unchanged.

| Path                          | What                                                                  |
| ----------------------------- | --------------------------------------------------------------------- |
| `src/lib/engine/`             | Everything that touches a platform page: selectors, clicking, waiting |
| `extension/src/main-world.ts` | Loads the engine into the page's own world                            |
| `extension/src/content.ts`    | The isolated half; the only file with `chrome.*`                      |
| `extension/src/background.ts` | Picks the page, drives the tab, relays progress                       |
| `extension/src/popup/`        | The popup, in Svelte                                                  |
| `extension/manifest.json`     | Chrome's manifest; the Firefox one is derived at build time           |
| `scripts/build-extension.mjs` | The build                                                             |

## Reproducing the review's own findings

The validator flags one `innerHTML` assignment in `assets/popup-*.js`. It is Svelte 5
instantiating a template — a detached `<template>` element, a string produced by its compiler
at build time, and a `trustedTypes` policy Svelte registers as `svelte-trusted-html`. No value
from a page, a network response or a user reaches it. It is in Svelte's runtime, not in any
file in this archive, and it cannot be avoided without changing UI frameworks.

## The same code, in public

This archive is a snapshot of https://github.com/thorstenalpers/CleanMyPosts at the tag for
this version. Nothing is stripped from it.
