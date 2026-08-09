![Banner](./assets/banner.png)

[![CI](https://img.shields.io/github/actions/workflow/status/thorstenalpers/CleanMyPosts/ci.yml?branch=main&style=flat-square&logo=githubactions&logoColor=white&label=CI)](https://github.com/thorstenalpers/CleanMyPosts/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/thorstenalpers/CleanMyPosts?style=flat-square&logo=github&label=release)](https://github.com/thorstenalpers/CleanMyPosts/releases/latest)
[![Downloads](https://img.shields.io/github/downloads/thorstenalpers/CleanMyPosts/total?style=flat-square&logo=github&label=downloads)](https://github.com/thorstenalpers/CleanMyPosts/releases)
[![Platform](https://img.shields.io/badge/platform-Windows-0078D6?style=flat-square&logo=windows&logoColor=white)](https://github.com/thorstenalpers/CleanMyPosts/releases)
[![Donate](https://img.shields.io/badge/donate-PayPal-00457C?style=flat-square&logo=paypal&logoColor=white)](https://www.paypal.com/donate/?hosted_button_id=QYHGE9LA9SNAN)
[![Stars](https://img.shields.io/github/stars/thorstenalpers/CleanMyPosts?style=flat-square&logo=github&label=stars)](https://github.com/thorstenalpers/CleanMyPosts)

**CleanMyPosts** is a lightweight Windows desktop app that securely deletes all posts, reposts, replies, likes, and followings from your X (formerly Twitter) account, as well as YouTube comments, in bulk using browser automation.

🌍 **Speaks your language.** The whole interface is available in **eleven languages** —
English, German, Spanish, French, Hindi, Italian, Japanese, Portuguese, Arabic, Russian and
Chinese — and follows the one Windows runs in unless you pick another. The delete engine is built for it too: it reads the pages structurally
wherever it can and asks every platform for English, so a translated interface on X or
YouTube does not stop a run.

---

## 🚀 Features

<img align="right" src="./assets/CleanMyPosts_X.png" alt="CleanMyPosts cleaning up an X account" width="460" />

### X (Twitter)

- 🔍 **See a list first** — posts, replies, reposts, likes, followings
- 🗑️ **Empty it** — any one of them, on its own
- 💣 **Delete everything** — all five, one after another, from a single button

### YouTube

- 🔍 **See a list first** — comments via Google My Activity, liked videos
- 🗑️ **Empty it** — either one, on its own
- 💣 **Delete everything** — comments and liked videos in one run

Every delete asks for confirmation first, and the confirmation for **Delete everything**
names each list it is about to empty. A finished run reports in the status bar — green when
it worked, amber when it found nothing, red when it failed — and the number of items removed
goes into the log.

**Delete everything** is also on the overview, once for each platform you are signed in to,
so the most common job is one click from the page the app opens on.

### 🤖 Assistant

X and YouTube change their pages without warning, and when they do, a selector that worked
last week finds nothing. The assistant is the answer to that, and it does three things:

- 🩹 **Write an action plan** — hand it the log of a failed run, or ask for a list the app
  does not handle yet, and it answers with a short plan: what to remove, and how one of them
  goes away — or how to reach a page or a button the app does not offer yet. Not code. It is a
  fixed vocabulary of clicks, waits, scrolls, navigation and typing, checked against a schema
  before anything runs, so a wrong answer can only ask for things the delete engine could
  already do, and only on the platform's own pages. Nothing a model wrote is ever evaluated
  inside your signed-in session, and you can read every step before you run it.

  Then, in this order: **Check first** counts what the plan would find and touches none of
  it. **Run once** tries it on the page in front of you. **Keep as action** gives it a name and
  keeps it: something that deletes lands in that platform's list beside the built-in ones,
  something that only opens a page or clicks a banner away lands in the sidebar as an entry of
  its own. The settings show every plan you kept with the day you kept it — a plan is a
  selector, and the platform moves.

- 🐞 **File a bug report** — it turns the same log into a report a maintainer can act on,
  and opens GitHub's issue form with the title and body already filled in. Pressing submit
  stays with you.
- 💬 **Ask a question** — about a run, a setting, or what the app just did.

Reachable two ways: the **Assistant** page, or the sparkles icon in the header, which opens it
as a column beside the platform so you can see the page you are asking about.

Every mode shows the exact text that would be sent **before** anything is sent, assembled from
the same functions that build the request, so the preview cannot drift from it. Asking for a
plan also sends a skeleton of the open page — tags, test ids and the words on buttons, with
every post, handle and address stripped out in the browser before it goes anywhere. Nothing
leaves the machine until you press the button.

It runs against [Claude Code](https://claude.com/claude-code) if it is installed on this
machine, or against a provider of your choice with your own API key — and it can be switched
off entirely in the settings.

The assistant is the only part of the app that needs either one. **Without them the app is
whole**: every list still deletes, and the assistant is simply not there — no entry, no icon,
no prompt to set one up. The settings say once that no source is configured, and nothing else
in the app mentions it again.

<br clear="both" />

---

## ℹ️ How It Works

There is **no API, no OAuth, and no token**. You sign in exactly as you would in a browser,
and the app clicks the same buttons you would — just without stopping. Deletions are
deliberately paced; the waits between them are configurable and exist to keep the platforms
from treating you as a bot.

### Why a browser and not an API?

Because neither platform will sell you the thing you actually want, and one of them will
charge you for the detour.

**Bulk deletion is not offered.** Not on X, not on YouTube. Their interfaces delete one item
at a time, each behind its own menu and its own confirmation — which is fine for a mistake
and hopeless for ten years of posting.

**The programmatic route costs.** X keeps API access behind paid tiers, so deleting your own
posts through it means paying a monthly fee for the privilege. YouTube's Data API is free but
metered: every deletion spends from a daily quota that runs out long before a busy account is
clean, and a large clean-up turns into a job spread over days.

**Driving the browser costs nothing.** The app opens the same pages you would, in your own
signed-in session, and presses the same buttons. No developer account, no key, no monthly
fee, no quota — and nothing about you leaves the machine, because there is no server of ours
for it to leave to.

---

## 🛠️ Requirements

- Windows 10 version 2004 (build 19041) or later, 64-bit
- X (Twitter) account (for X features)
- Google account (for YouTube features)

Nothing else — the app ships everything it needs and uses the WebView2 runtime that ships
with Windows. The only data it writes is your own preferences and the browser profile that
keeps you signed in, under `%AppData%` and `%LocalAppData%`.

---

## 📦 Installation

Once your system meets the requirements, follow these steps to install **CleanMyPosts**:

1. Download the latest version from [Releases](https://github.com/thorstenalpers/CleanMyPosts/releases).
2. Run the installer. Ignore the warning about the app being from an unverified publisher.
3. Launch the app and log in with your X (formerly Twitter) or Google account.
4. Start bulk deleting your posts, replies, reposts, likes, following, and YouTube comments easily.

---

## 🎬 See It in Action

**Overview** — where you land. Which accounts are signed in, what each platform has to clean,
and **Delete everything** for every platform you are signed in to.

<img src="./assets/Overview.png" alt="The overview, listing what each platform can clean" width="700" />

**X (Twitter)** — **Delete everything** running: posts, replies, reposts, likes and
followings, one list after the next. The sub-navigation stays open the whole time, so the
controls do not disappear mid-task.

<img src="./assets/X.webp" alt="Delete everything running across posts, replies, reposts, likes and followings on X" width="700" />

**YouTube** — comments and liked videos in a single run, each with its own status.

<img src="./assets/Youtube.webp" alt="Comments and liked videos being deleted on YouTube" width="700" />

**Assistant** — the exact text that would be sent, shown before anything is sent.

<img src="./assets/Assistant.png" alt="The assistant, showing what would be sent before it is sent" width="700" />

---

## 🧟‍♂️ Without the App: Run the Scripts by Hand

Every delete action is also published as a standalone script — one file per list, for people
who are not on Windows or would rather not install anything.

These are generated from the app's own delete engine at build time rather than written
separately, which is the whole difference from the versions that shipped this way before 3.0:
a selector fixed in the app is fixed in the download, because they are the same code. There is
also nothing left to fill in — each script starts by itself and works on whatever page it is
pasted into, so there is no function to call and no username to pass.

### 🔧 Steps

1. Open the URL for the list you want to clear, and sign in. Replace `USERNAME` with your own X
   handle — the part after `x.com/`, without the `@`.
2. Download the script below and open it in a text editor. Read it — you are about to run it in
   your signed-in account, and it is unminified for exactly that reason.
3. Press <kbd>F12</kbd> to open developer tools, then go to the **Console** tab.
4. Paste the whole file and press <kbd>Enter</kbd>.
5. It starts immediately and reports each step. Close the tab to stop it.

The two waits at the top of each file are the brake against the platform treating your session
as automation. Raising them is always safe; lowering them is what gets a session flagged.

> **Deletion cannot be undone.** The script keeps going for as long as it finds anything.

### 📜 The scripts

Every link points at the newest release, so it stays current.

| List             | Open this page                                                                           | Script                                                                                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Posts            | [`x.com/search?q=from:USERNAME`](https://x.com/search?q=from%3AUSERNAME&src=typed_query) | [cleanmyposts-x-delete-posts.js](https://github.com/thorstenalpers/CleanMyPosts/releases/latest/download/cleanmyposts-x-delete-posts.js)                   |
| Replies          | [`x.com/USERNAME/with_replies`](https://x.com/USERNAME/with_replies)                     | [cleanmyposts-x-delete-replies.js](https://github.com/thorstenalpers/CleanMyPosts/releases/latest/download/cleanmyposts-x-delete-replies.js)               |
| Reposts          | [`x.com/USERNAME`](https://x.com/USERNAME)                                               | [cleanmyposts-x-delete-reposts.js](https://github.com/thorstenalpers/CleanMyPosts/releases/latest/download/cleanmyposts-x-delete-reposts.js)               |
| Likes            | [`x.com/USERNAME/likes`](https://x.com/USERNAME/likes)                                   | [cleanmyposts-x-delete-likes.js](https://github.com/thorstenalpers/CleanMyPosts/releases/latest/download/cleanmyposts-x-delete-likes.js)                   |
| Following        | [`x.com/USERNAME/following`](https://x.com/USERNAME/following)                           | [cleanmyposts-x-delete-following.js](https://github.com/thorstenalpers/CleanMyPosts/releases/latest/download/cleanmyposts-x-delete-following.js)           |
| YouTube comments | [`myactivity.google.com`](https://myactivity.google.com/page?page=youtube_comments)      | [cleanmyposts-youtube-delete-comments.js](https://github.com/thorstenalpers/CleanMyPosts/releases/latest/download/cleanmyposts-youtube-delete-comments.js) |
| Liked videos     | [`youtube.com/playlist?list=LL`](https://www.youtube.com/playlist?list=LL)               | [cleanmyposts-youtube-delete-likes.js](https://github.com/thorstenalpers/CleanMyPosts/releases/latest/download/cleanmyposts-youtube-delete-likes.js)       |

All seven are attached to every
[release](https://github.com/thorstenalpers/CleanMyPosts/releases/latest) as well.

---

## 🩺 Troubleshooting

Most runs that go wrong go wrong in one of a few ways. The app's own log is the first place
to look — **Log** in the sidebar, or ask the built-in assistant, which is handed this same
list along with your log.

| Symptom                                                                                 | Why                                                                                                                                    | What to do                                                                                                                                                                                                              |
| --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nothing is deleted, and the log ends with _"No scroll change; assuming no more posts."_ | The page had nothing to act on: you are signed out, or the profile shown is not yours.                                                 | Check the dot next to the platform in the sidebar. If it is dim, sign in inside the app's browser pane and start the action again.                                                                                      |
| A run deletes a handful of items and then stops                                         | The platform is throttling the session — it has decided the clicking looks automated.                                                  | Raise **Settings → Timing**: _between deletions_ to 1500 ms or more, _after a page loads_ to 5000 ms. Then wait a few minutes before the next run. Lower values are what get a session flagged.                         |
| The browser pane stays blank or white                                                   | The WebView2 runtime is missing, or the platform answered with an interstitial (consent, captcha, re-login).                           | Install the [Evergreen WebView2 runtime](https://developer.microsoft.com/microsoft-edge/webview2/) and restart. If it is an interstitial, click through it once by hand — the session is yours, the app only drives it. |
| A cookie banner sits over everything                                                    | The app clicks consent banners away by itself, preferring the _reject_ button, but a wording it has never seen gets through.           | Dismiss it once by hand; the choice is stored in the same browser profile and does not come back. Please report the wording so it can be added.                                                                         |
| _"Deletion failed."_ immediately, on every item                                         | The platform changed its markup, so the buttons the engine looks for are no longer where they were.                                    | Update to the [latest release](https://github.com/thorstenalpers/CleanMyPosts/releases/latest) first. If that does not fix it, this is a real bug — report it with the log.                                             |
| Some likes or followings survive several runs                                           | Not everything is reachable from the list: protected accounts, items behind _Show more_, and posts that were already gone server-side. | Run the action once more. What is left after two clean runs belongs in a bug report.                                                                                                                                    |
| YouTube comments cannot be reached                                                      | My Activity asks for the Google sign-in again, per session.                                                                            | Open the YouTube pane, sign in, and start the action again.                                                                                                                                                             |
| _Check for updates_ reports nothing                                                     | Updates only work in the installed build, and the check needs network access.                                                          | Compare your version on the **Info** page with the [latest release](https://github.com/thorstenalpers/CleanMyPosts/releases/latest) and install it manually if they differ.                                             |

Deletions cannot be undone, and no run is ever resumed from a copy of your data — there is
no copy. If something was removed that should not have been, it is gone on the platform's
side too.

---

## 🧑‍💻 Building from Source

Requires the [Rust toolchain](https://rustup.rs/) and [Node.js 24+](https://nodejs.org/).

```bash
npm ci
npm run build
npm run start
```

`npm run build` before the first `npm run start` is not optional. The Rust crate compiles
the delete engine into itself with `include_str!("../../dist/content/content.js")`, and
`npm run start` does not produce that file — it runs Vite's dev server, which serves the
interface and nothing else. Without the build the crate does not compile at all. The same
applies after any change under `src/lib/engine/`: the app keeps running the bundle it was
compiled with until it is rebuilt.

`npm run start` then opens the real Tauri window, with hot reload for the interface.

Build the installer:

```bash
npm run app:build
```

Working on the UI alone is faster in the browser — it falls back to an in-memory mock host,
so no WebView2 is needed:

```bash
npm run dev
```

Checks and tests:

```bash
npm run lint
npm run check
npm run test
npm run test:e2e
cargo test --manifest-path src-tauri/Cargo.toml --lib
```

`npm test` covers the interface and the engine; the Rust half has no npm script and is the
line above. `npm run test:e2e` builds the engine bundle first and runs it in real Chromium
against saved page markup — never against the live sites, so nothing is deleted for real.

The architecture, the UI↔host bridge, and the design rules are documented under
[`.agents/docs/`](.agents/docs/) — start at [AGENTS.md](AGENTS.md).

---

## 🤝 How to Contribute

We welcome contributions to **CleanMyPosts**! If you’d like to improve the project, please:

1. Check out our [contributing guidelines](CONTRIBUTING.md).
2. Ideally, open an issue before starting work.
3. Submit a pull request with your changes.

Thank you for helping make **CleanMyPosts** better!

---

## ⚠️ Disclaimer

This tool automates a web browser to delete your own content. It uses no API and no token —
it presses the same buttons you would, in your own signed-in session.

**Deletions are permanent.** Nothing here can undo them, and neither platform offers a way
back. Look at a list before you empty it.

**Automation may conflict with the platforms' terms of use.** They restrict automated
access, and the consequence would fall on your account rather than on this software. You use
it at your own risk.

The author is not affiliated with X (formerly Twitter) or Google. Provided as-is under the
MIT licence, without warranty of any kind.

---

## 🐞 Report a Bug

If you encounter any issues or bugs, please [report them here](https://github.com/thorstenalpers/CleanMyPosts/issues).
