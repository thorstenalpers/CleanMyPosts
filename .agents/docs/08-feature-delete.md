# Feature: Delete Actions

## Flow per action

```
User clicks "Delete all"
  → (optional) confirm dialog
  → site.runAction RPC { requestId, platform, action, timeouts }
  → host: BuildUrlAsync → NavigateToUrlAsync → wait NavigationCompleted
  → host: window.__cmp.run(platform, action, paramsJson) via ExecuteScriptAsync
  → content script: click/confirm/retry loop → postProgress after each item
  → host: relay progress push events to chrome UI (accumulated count across reloads)
  → content script: postDone or postError
  → host: if isEmpty() → done; else reload → repeat up to MaxRetriesPerAction
  → RPC result: { deletedCount }
  → UI: show final count or error message
```

## X actions

| Action     | Target URL                                             | What the script does                                   |
|------------|--------------------------------------------------------|--------------------------------------------------------|
| Posts      | `/search?q=from%3A{user}&src=typed_query`              | Opens menu on each post → Delete                       |
| Reposts    | `/{user}`                                              | Opens menu on each repost → Undo Repost                |
| Replies    | `/{user}/with_replies`                                 | Opens menu on each reply → Delete                      |
| Likes      | `/{user}/likes`                                        | Opens menu on each liked tweet → Unlike                |
| Following  | `/{user}/following`                                    | Clicks Following button on each account → Unfollow     |

The X username is read once from the live page via `window.__cmp.getUserName()`, which the
content script extracts from the logged-in session. Navigation is never blocked on login: if
no username is found, `site.navigate` falls back to the X home page so the user can sign in
manually. The delete/show buttons stay disabled until a `siteLogin` push confirms login.

## YouTube actions

| Action         | Target URL                                                                    | What the script does                         |
|----------------|-------------------------------------------------------------------------------|----------------------------------------------|
| Comments       | `https://myactivity.google.com/page?hl=en&page=youtube_comments`             | Opens menu on each entry → Delete            |
| Liked videos   | `https://www.youtube.com/playlist?list=LL`                                    | Opens menu on each video → Remove from playlist |

YouTube login detection uses `window.__cmp.getLoginStatus()`. The content script reads a
DOM marker; the host reports the detected state via the `siteLogin` push and pushes `false`
when it cannot confirm login (no false-positive "logged in"). Detection re-runs on every
navigation, so signing in and re-opening YouTube enables the actions.

Every automated click in the content script goes through `clickWithCursor` (`engine/dom.ts`),
which moves a visible pointer marker + ripple to the target before clicking so the user can
follow the automation on the live page.

## Retry loop

The host loops until one of:
- `isEmpty()` returns `true` (the page has no more items to act on).
- `MaxRetriesPerAction` consecutive rounds with `deletedCount == 0` (stuck — logs a
  warning and returns the total so far).

Between rounds: the host calls `Reload()` on the SiteWebView and waits for
`NavigationCompleted` + `waitAfterDocumentLoad` before starting the next round. The
content script is already registered and does not need to be re-injected.

## Progress accumulation

`deletedCount` in `progress` push events is the count for the **current round only**.
The host adds the `progressBase` (total from completed rounds) before forwarding to the
chrome UI, so the counter is monotonically increasing across reloads.

## Confirmation dialog

When `confirmDeletion` is true in settings, a destructive alert dialog is shown before
`site.runAction` is sent. The dialog names the action and platform. No countdown, no typed
confirmation — one "Delete" button is sufficient.
