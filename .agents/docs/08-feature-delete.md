# Feature: Delete Actions

## Flow per action

```
User clicks "Delete all"
  → (optional) confirm dialog
  → site.navigate RPC { platform, action } → host: target_url → assign in site webview
  → site.runAction RPC { requestId, platform, action, timeouts }
  → host: window.__cmp.run(platform, action, paramsJson) via eval
  → content script: click/confirm/retry loop → postProgress after each item
  → host: relay progress push events to chrome UI
  → content script: postDone or postError → resolves the pending call
  → RPC result: { deletedCount }
  → UI: show final count or error message
```

## X actions

| Action    | Target URL                                | What the script does                               |
| --------- | ----------------------------------------- | -------------------------------------------------- |
| Posts     | `/search?q=from%3A{user}&src=typed_query` | Opens menu on each post → Delete                   |
| Reposts   | `/{user}`                                 | Opens menu on each repost → Undo Repost            |
| Replies   | `/{user}/with_replies`                    | Opens menu on each reply → Delete                  |
| Likes     | `/{user}/likes`                           | Opens menu on each liked tweet → Unlike            |
| Following | `/{user}/following`                       | Clicks Following button on each account → Unfollow |

The X username is read once from the live page via `window.__cmp.getUserName()`, which the
content script extracts from the logged-in session. Navigation is never blocked on login: if
no username is found, `site.navigate` falls back to the X home page so the user can sign in
manually. The delete/show buttons stay disabled until a `siteLogin` push confirms login.

## YouTube actions

| Action       | Target URL                                                       | What the script does                            |
| ------------ | ---------------------------------------------------------------- | ----------------------------------------------- |
| Comments     | `https://myactivity.google.com/page?hl=en&page=youtube_comments` | Opens menu on each entry → Delete               |
| Liked videos | `https://www.youtube.com/playlist?list=LL`                       | Opens menu on each video → Remove from playlist |

YouTube login detection uses `window.__cmp.getLoginStatus()`. The content script reads a
DOM marker; the host reports the detected state via the `siteLogin` push and pushes `false`
when it cannot confirm login (no false-positive "logged in"). Detection re-runs on every
navigation, so signing in and re-opening YouTube enables the actions.

Every automated click in the content script goes through `clickWithCursor` (`engine/dom.ts`),
which moves a visible pointer marker + ripple to the target before clicking so the user can
follow the automation on the live page.

## Retry loop

The loop lives in the page, not in the host. Each action's `run` keeps scrolling and
clicking until it can no longer find an item, then resolves with the count. A failed click
is retried; a run of failures with no scroll progress ends the action.

## Progress accumulation

`deletedCount` in `progress` push events is the running total for the call and is forwarded
to the chrome UI unchanged. The host keeps the last value so a cancel can still resolve the
call with the count reached so far.

## Confirmation dialog

When `confirmDeletion` is true in settings, a destructive alert dialog is shown before
`site.runAction` is sent. The dialog names the action and platform. No countdown, no typed
confirmation — one "Delete" button is sufficient.
