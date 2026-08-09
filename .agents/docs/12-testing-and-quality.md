# Testing and Quality

## Where each test belongs

| Level                 | Tool                          | Covers                                                                            |
| --------------------- | ----------------------------- | --------------------------------------------------------------------------------- |
| Engine modules        | Vitest + happy-dom + fixtures | selectors, click loops, retry conditions, stop detection                          |
| Stores, bridge client | Vitest                        | state transitions, error paths, `requestId` correlation                           |
| Components, views     | Vitest + Testing Library      | idle/running/done/error states, confirmation dialog                               |
| Host logic            | `cargo test`                  | URL building, handle sanitising, settings round-trip, log buffer, timestamp shape |

## The tests this project actually needs

Three places decide whether the app is trustworthy:

1. **Engine against fixtures.** For each delete action, a trimmed, anonymized DOM snapshot of
   the real page under `__fixtures__/`. When the platform changes its markup, the test breaks
   — not the user mid-deletion.
2. **Host URL building.** `target_url` decides which page a run lands on; `show*` and
   `delete*` must agree, and an unknown pair must have no target at all.
3. **Settings serialisation.** The UI validates against camelCase Zod schemas, so a rename
   on the Rust side would break the contract silently rather than at compile time.
4. **Bridge parity.** The same problem one level up: `contract.ts` and the host's `dispatch`
   are two lists nothing reconciles. See below.

## The language matrix

`e2e/languages.spec.ts` runs the three text-dependent actions — X posts, YouTube liked
videos, YouTube comments — against the same fixtures in German, Spanish, Japanese, Turkish
and Arabic. `e2e/fixtures/languages.ts` does the translating, and takes away every
language-independent hook the real page offers at the same time: `data-id` on Google's
confirm button, and both `aria-label`s. What is left is what the engine has to reach through
on a page nobody here can read — a class, a `jscontroller`, and a word from
`config.ts`.

**What it proves and what it does not.** The strings are translations written for the test,
not copies taken from the live pages; this repository has no account on either platform to
read them from. So the matrix catches a hard-coded `'Delete'`, a case-sensitive compare, a
structural selector that only worked because an English label happened to be there, and an
RTL assumption. It does not confirm that `deleteMenuText`, `confirmDeleteText` and
`removeFromLikedText` say what X and YouTube actually ship. Only a run on a real account in
that language does that.

It has already earned its keep twice: `removeFromLikedText` had no entry for Japanese,
Chinese, Arabic, Hindi or Turkish, and the comments fixture hung its ✕ off the wrong element,
so the English spec passed for a reason the real page does not have.

### Watching a real run in another language

Both platforms can be switched without a VPN, and both addresses are inside the plan
allow-list, so a saved action reaches them:

```json
{
	"kind": "once",
	"steps": [{ "step": "navigate", "url": "https://www.youtube.com/?persist_hl=1&hl=es" }]
}
```

YouTube takes the language from the URL and keeps it. X has no such parameter — its display
language is a `<select>`, which the plan vocabulary deliberately cannot set, so the plan can
only open the page:

```json
{ "kind": "once", "steps": [{ "step": "navigate", "url": "https://x.com/settings/language" }] }
```

Neither has been run against a live account from here; the allow-list entries are covered by
`plan.test.ts`, the pages themselves are not.

## What is not tested

No E2E tests against live platforms. They need real accounts, delete real data, and fail
whenever a platform changes something — which the fixture test catches earlier and more
reliably.

**Nothing in this repository creates content.** No test posts, reposts, likes or follows to
seed something to delete: it would need credentials CI does not have, it would publish to a
real account and reach real third parties on every run, and it would put a "post to X"
capability into a delete engine that has no other reason to carry one. The fixtures already
contain the objects to delete, in every language.

The one thing not covered by a compiler is now covered by a test: `dispatch-parity.test.ts`
reads the `match` in `src-tauri/src/commands/mod.rs` and compares its arms to the keys of
`BridgeMethods`. Two hand-kept lists of the same thing in two languages, and a method added
to only one of them breaks at runtime rather than at build. The C# host had this check; the
Rust port lost it.

`cargo fmt --check` and `cargo clippy -- -D warnings` are CI gates: a warning is something
to fix, not to live with.

## CI

On every push and PR to `main`, two jobs on `windows-latest`, with older runs on the same
ref cancelled: `frontend` runs `npm run lint` · `npm run check` · `npm run test:coverage` ·
`npm run test:e2e` · `npm run build` and uploads the coverage report; `rust` runs
`npm run build` (the crate cannot compile without `dist/content/content.js`) ·
`cargo fmt --check` · `cargo clippy --all-targets -- -D warnings` · `cargo test`.

The Playwright e2e suite drives the built content script against static DOM fixtures in a
real Chromium, stubbing the host by collecting `chrome.webview.postMessage` calls. It is
host-agnostic by construction, which makes it the regression net for any change to the host
or the shell UI.

`main` is protected, direct pushes are blocked, the build status must be green.
Branches: `feature/<name>`, `fix/<name>`, `release/vX.Y.Z`.

## Release signing

`Deploy Release` builds the NSIS installer and signs the updater artifact with the minisign
keypair generated by `tauri signer generate`. The public half lives in
`src-tauri/tauri.conf.json` under `plugins.updater.pubkey`; the private half is the
`TAURI_SIGNING_PRIVATE_KEY` repository secret and is never in the repo.

The two halves have to match. An installed app verifies `latest.json` against the public key
it was **built with**, so a rotation only reaches users who install a release built after it:

1. `npx tauri signer generate -w path/to/new.key` — do this outside the repository tree.
2. Put the contents of `new.key.pub` into `plugins.updater.pubkey` and commit.
3. `gh secret set TAURI_SIGNING_PRIVATE_KEY < path/to/new.key`, plus
   `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` if the key has one.
4. Release. Anyone still on a build from before step 2 will not accept it and has to
   reinstall by hand — which is why the key is rotated only when it has actually leaked.

With a `pubkey` configured but the secret missing, `tauri build` writes the installer and
_then_ fails, so the job stops rather than shipping something nobody can update from.

## Logging

A ring buffer in the host feeds the log view and is streamed live via the `log` push event.
Three levels: `info`, `warning`, `error`.

Logged: action start and end with counts, each item failure with a reason, login status
changes, retry counts, page reloads.

**Never logged:** post content, user handles, cookies, URLs with tokens. The log must be
safe to copy into a bug report.
