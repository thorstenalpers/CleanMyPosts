# Building this add-on from source

Written for a reviewer with this archive and nothing else, and short enough to paste whole into
AMO's reviewer notes.

The package is produced by Vite, which bundles and minifies, and by the Svelte compiler.

## Two products in one archive

CleanMyPosts is a Windows desktop app and a browser extension sharing the code that does the
deleting. The archive is the whole repository, unstripped.

For the add-on, only `extension/` (the add-on) and `src/lib/` (the shared delete engine, plus
the components and locales the popup uses) matter. `src-tauri/` is the desktop app — Rust,
built by none of the steps below, needing no toolchain you have to install, and reaching no
part of the add-on. `e2e/`, `assets/` and `release-notes/` are not build inputs either.

## Build environment

- **OS:** any that Node runs on. Built on Windows 11 and on Ubuntu (CI).
- **Node.js 24.x** — https://nodejs.org, or `nvm install 24`.
- **npm 11.x**, which ships with Node 24.
- Nothing else. No Rust, no Python, no native toolchain.

## Steps

From the root of the archive (GitHub's zip puts it one directory down, named after the
repository and tag — start inside that):

```
npm ci
npm run pack:extension
```

`npm ci`, not `npm install`: it installs exactly what `package-lock.json` pins, so the build is
the one that produced the upload.

That writes `dist/extension/cleanmyposts-firefox-<version>.zip` — the uploaded package — and
leaves it unpacked in `dist/extension/firefox/`.

## What the build does

`scripts/build-extension.mjs`:

1. Three Vite builds, each a self-contained IIFE — `main-world.js`, `content.js`,
   `background.js`. Separate because a content script cannot import, so they cannot share a
   chunk.
2. One Vite build for `popup.html` and its assets.
3. Copies `extension/manifest.json` and the icons from `src-tauri/icons/`.
4. Copies the result to `dist/extension/firefox/` and rewrites two manifest fields:
   `background.service_worker` becomes `background.scripts`, and `browser_specific_settings` is
   added with the add-on id, the minimum versions, and
   `data_collection_permissions: { required: ["none"] }`.

Chrome's output differs from Firefox's in that one file and nothing else.

## The one validator warning

The `innerHTML` assignment flagged in `assets/popup-*.js` is Svelte 5 instantiating a template:
a detached `<template>` element, a string its compiler produced at build time, and a
`trustedTypes` policy Svelte registers as `svelte-trusted-html`. No value from a page, a
response or a user reaches it. It is in Svelte's runtime, not in any file here, and cannot be
avoided without changing UI frameworks.

## The same code, in public

https://github.com/thorstenalpers/CleanMyPosts — this archive is the tag for this version.
