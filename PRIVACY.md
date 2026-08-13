# Privacy Policy

**CleanMyPosts** — desktop app and browser extension
Last updated: 2026-08-12

## The short version

CleanMyPosts collects nothing, stores nothing about you, and sends nothing anywhere. There is
no account, no server, and no analytics. What it deletes, it deletes inside your own browser
session, and it is the only thing it does.

## What is collected

Nothing.

No personal information, no account content, no browsing history, no location, no financial
information, no health information, no authentication credentials, no user activity, and no
website content. None of it is read for any purpose other than clicking the item in front of
it, and none of it is retained after the click.

The extension has no server component. There is nothing for data to be sent to.

## What is stored

The browser extension stores two things, both in the browser's own extension storage and
neither of them anywhere else.

**Until the browser closes** (`storage.session`): the progress of a run — which action is
running, how many items it has removed, the tab it is working in, and the recent lines of its
log. This exists because Manifest V3 stops and restarts the extension's background worker
while a run is going, and the count would be lost every time it did.

It also holds your X handle for the length of a run. The handle is read off the page you are
signed in to, and it is there because every X address the extension navigates to is built from
it — `x.com/<handle>/likes` and so on. It is never sent anywhere, and it is gone when the
browser closes.

**Kept between sessions** (`storage.local`): your own preferences for the popup — which
platforms to show, the three waits, the theme, the language, and whether the welcome note has
been dismissed. Nothing here comes from a platform page.

Neither store ever holds a post, a comment, a video title, or any other content from a page.

The desktop app stores its own settings (theme, timeouts, log visibility) and its window
position, in the user's own application data folder. It stores no posts, likes, comments or
account content, and it has no database.

Your login session is held by the browser, in its own cookie store, exactly as it is for any
other site you are signed in to. CleanMyPosts never reads, copies or transmits it.

## What is transmitted

Nothing, by the extension.

The desktop app talks to exactly two kinds of host, both only on request: the GitHub release
endpoint when it checks for an update, and — only if the user configures a hosted AI assistant
and only when they press Ask — that provider. The assistant is a desktop-only feature and is
not part of the browser extension.

## Permissions, and why each one exists

- **`storage`** — the run progress described above. Nothing else is written.
- **`tabs`** — to find the tab to work in and to drive it to the list being emptied.
- **Access to `x.com`, `www.youtube.com` and `myactivity.google.com`** — these are the pages
  the items live on. Deleting a YouTube comment happens on Google My Activity, which is why
  that third host is there. The extension runs on no other site.

## No remote code

Everything the extension runs is contained in the package you install. No script is fetched,
evaluated or updated from anywhere at runtime.

## Third parties

There are none. No advertising, no trackers, no SDKs, no data brokers, no sale or transfer of
data — there is no data to sell or transfer.

## Children

CleanMyPosts is not directed at children and collects no information from anyone.

## Changes

Changes to this policy are published in this file, in the project's public repository, with
their date. The version history is visible to anyone.

## Contact

Open an issue at https://github.com/thorstenalpers/CleanMyPosts/issues
