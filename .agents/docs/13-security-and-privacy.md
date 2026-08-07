# Security and Privacy

By not using platform APIs, most of the classic attack surface disappears: for X and YouTube
there are no OAuth flows, no refresh tokens, and no client credentials to protect.

What remains is concentrated: the app operates inside a logged-in browser context and
deletes data irreversibly.

One credential does exist, and it is worth being precise about what it is not. The assistant
may be pointed at a hosted model, and that needs an API key. It grants nothing on X or
YouTube, it is the user's own key with their own provider, and the whole feature can be left
switched off — the default source is the `claude` binary on the machine, which needs no key.

## What the app holds

| Asset                      | Where                      | Protection                                        |
| -------------------------- | -------------------------- | ------------------------------------------------- |
| Platform session (cookies) | WebView2 user profile      | as in the browser; the app never reads them       |
| Settings                   | `%AppData%\CleanMyPosts\`  | file-system rights of the Windows account         |
| Window geometry            | `%AppData%\CleanMyPosts\`  | file-system rights of the Windows account         |
| Assistant API key          | Windows Credential Manager | the Windows account, and never readable by the UI |
| Log                        | ring buffer in memory      | contains no user content                          |

There is no local database of user content and no pre-deletion export file. What does not
exist cannot leak. The one secret the app can hold is kept where Windows keeps secrets, not
in a store this project would then be responsible for.

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
   check and — only on an explicit Ask, and only when the user has chosen a hosted assistant
   provider — that provider. No telemetry, no crash reporting, no analytics — not opt-out,
   but not present.
5. **An assistant question carries the log and nothing else.** The prompt is built in
   `src/lib/assistant-context.ts` from a fixed description of the app plus the tail of the log
   buffer. That buffer is already the one thing this project guarantees is free of post
   content, handles, cookies and tokens, which is what makes it safe to hand to a third party.
   Anything else — the site DOM, the user's name, the settings — deliberately stays behind.
6. **The API key never reaches the frontend.** The HTTP call to a provider is made in the host,
   not in the chrome webview: the key is read from the credential store at the moment of the
   request, is scrubbed out of any error message on the way back, and the webview's CSP stays
   closed to every remote origin. The UI can ask whether a key exists and can replace or forget
   one; it can never read one.
7. **The chrome webview runs under a strict CSP**, set in `tauri.conf.json`. No remote origin
   of any kind, and `object-src`, `base-uri`, `frame-ancestors` and `form-action` are all
   `'none'`. Tauri hashes the bundled inline scripts at compile time, so
   `script-src 'self'` holds without a `'unsafe-inline'` escape; `style-src` keeps
   `'unsafe-inline'` because Svelte and Tailwind set styles on the element. The policy is
   injected only into assets Tauri serves — the site webviews load remote pages and are
   governed by `capabilities/site.json` instead, which is why tightening this cannot break
   deletion.

   To re-check it after a change: serve `build/` over HTTP with the policy pasted into
   `index.html` as a `<meta http-equiv="Content-Security-Policy">`, relaxing `script-src` to
   include `'unsafe-inline'` — a meta tag cannot carry the nonce Tauri adds at compile time,
   and without that relaxation every page simply fails to hydrate and tells you nothing about
   the other directives. Then walk the routes. **Do not use a console reader**: a CSP refusal
   is emitted by the browser, not through `console.*`, so it will report nothing either way.
   Look at the DOM — `document.documentElement.style.colorScheme` is empty when the inline
   scripts were blocked.

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
