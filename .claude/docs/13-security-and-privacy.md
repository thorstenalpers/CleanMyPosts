# Security and Privacy

By not using platform APIs, most of the classic attack surface disappears: there are no
OAuth flows, no refresh tokens, no API secrets, and no client credentials to protect.

What remains is concentrated: the app operates inside a logged-in browser context and
deletes data irreversibly.

## What the app holds

| Asset                      | Where                     | Protection                                  |
| -------------------------- | ------------------------- | ------------------------------------------- |
| Platform session (cookies) | WebView2 user profile     | as in the browser; the app never reads them |
| Settings                   | `%AppData%\CleanMyPosts\` | file-system rights of the Windows account   |
| Log                        | ring buffer in memory     | contains no user content                    |

There is no local database of user content, no pre-deletion export file, no key store.
What does not exist cannot leak.

## Rules

1. **Cookies are never read, copied, exported, or logged.** Session access is only implicit:
   the WebView2 uses the cookie itself. The host never sees it.
2. **The content script is only injected into the intended origins.** The init script checks
   `window.location.host` against a whitelist before it defines anything. On a redirect to a
   foreign origin, `window.__cmp` is not available.
3. **The chrome origin and the platform origins stay separate.** Tauri capabilities do the
   enforcing: `capabilities/chrome.json` grants `bridge_call` to the chrome webview only,
   and `capabilities/site.json` grants the site webview nothing but `content_message`, and
   only on the listed remote origins. A page from x.com cannot call bridge methods.
4. **No outbound traffic other than to the sites the user opens**, plus an optional update
   check. No telemetry, no crash reporting, no analytics — not opt-out, but not present.

## Threats that are real

- **Deleting in the wrong account.** Two X accounts can both be open. The account handle
  visible in the SiteWebView is the only indicator. Show it prominently before running.
- **Stale selectors clicking the wrong element.** Before confirming a delete action, the
  content script must verify that the expected confirmation dialog appeared — never blindly
  click a second element.
- **Automation detection by the platform.** Configurable waits are the only countermeasure.
  Conservative defaults; the user may raise them further.

## What the app deliberately does not do

No bot-detection bypass, no CAPTCHA solving, no disguising as another client. If an action
is throttled or blocked, the app reports it and waits. A tool that deceives platform
protections would no longer be what it claims to be.
