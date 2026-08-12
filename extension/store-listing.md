# Store listing

Copy for the Chrome Web Store developer dashboard, and the fields AMO asks for alongside it.
Kept here so the wording is reviewed like everything else and does not live only in a web form.

Field limits are Chrome's. Nothing below is at its limit; the counts are noted so an edit does
not quietly overrun one.

---

## Item name

`75 characters max — using 12`

```
CleanMyPosts
```

## Item summary

`132 characters max — using 112`

```
Bulk-delete your posts, replies, reposts, likes and follows on X, and your comments and liked videos on YouTube.
```

## Detailed description

`16,000 characters max — using about 2,700`

```
Neither X nor YouTube will let you delete in bulk. Their interfaces remove one item at a time,
each behind its own menu and its own confirmation — fine for a mistake, hopeless for ten years
of posting.

CleanMyPosts does it for you, in the tab in front of you, in the account you are already
signed in to.

WHAT IT DELETES

On X:
• Posts
• Replies
• Reposts
• Likes
• Accounts you follow

On YouTube:
• Comments
• Liked videos

HOW IT WORKS

There is no API, no OAuth and no token. The extension opens the same pages you would, finds
the same menus you would, and clicks the same buttons you would — it just does not stop. You
stay signed in through your normal browser session, and nothing is ever asked of you but a
click on Start.

That matters for two reasons. X keeps API access behind paid tiers, so deleting your own posts
programmatically means paying a monthly fee for the privilege. YouTube's Data API is free but
metered, and a large clean-up runs out of quota long before it runs out of comments. Driving
the page costs nothing and needs no developer account.

Deletion is deliberately slow. The pauses between actions are the only thing keeping the
platforms from treating your session as a bot, and they are not there to be optimised away. A
large account takes a while. That is the trade.

WHAT IT DOES NOT DO

• No account. Nothing to sign up for.
• No server. There is nowhere for your data to go, because there is no "away".
• No analytics, no telemetry, no crash reporting.
• Nothing stored. Your posts, likes and comments are read only long enough to click them, and
  never written down.
• No remote code. Everything it runs ships inside the extension.

It runs on x.com, youtube.com and Google My Activity — where YouTube comments actually live —
and on no other site.

BEFORE YOU START

Deletion cannot be undone. There is no trash, no restore and no export: once an item is gone
from X or YouTube, it is gone. Download your data from the platform first if you want to keep
a copy.

Start with a small list to see what it does before pointing it at ten years of posts.

OPEN SOURCE

Every line is public, including the selectors it clicks and the pauses it waits. If you want
to know what runs in your signed-in session, you can read it — and if a platform changes its
markup, you can see the fix land.

https://github.com/thorstenalpers/CleanMyPosts

There is also a Windows desktop app, which does the same things with settings, saved actions
and an optional AI assistant that writes new ones. Same engine, same repository.
```

## Category

`Productivity` — the item does one job on the user's own account. Not "Social & Communication",
which reads as a client for the platform rather than a tool that acts on it.

## Language

`English (United States)` as the primary listing. The desktop app ships 12 locales
(`src/lib/i18n/`); the extension UI does not use them yet, so a translated listing would
promise an interface that is still English.

---

## Graphics

None of these exist yet. Nothing here can be submitted without them.

| Asset              | Size                    | Required                                      |
| ------------------ | ----------------------- | --------------------------------------------- |
| Store icon         | 128×128 PNG             | yes — `src-tauri/icons/128x128.png` may serve |
| Screenshot         | 1280×800 or 640×400 PNG | yes, at least 1, up to 5                      |
| Small promo tile   | 440×280 PNG             | only to be eligible for featuring             |
| Marquee promo tile | 1400×560 PNG            | optional                                      |

Screenshots have to show the extension itself, not a mock-up, and the store rejects ones that
are mostly text. What is worth showing, in order:

1. The popup open over an X profile, mid-run, with the count climbing.
2. The popup's action list, so the seven things it deletes are visible at a glance.
3. A finished run with its result.

Every screenshot needs the account content in it blurred or replaced with a throwaway account.
A real timeline in a store screenshot is a permanent, indexed copy of it.

---

## Privacy tab

The single purpose and the permission justifications are what the review actually turns on.
Each justification has to say what breaks without the permission — a restatement of the
permission's name gets rejected.

### Single purpose

```
CleanMyPosts deletes the signed-in user's own content on X and YouTube in bulk — posts,
replies, reposts, likes and follows on X, and comments and liked videos on YouTube. It does
this by clicking the platform's own controls on the user's own pages. It has no second
function.
```

### Permission justifications

**`storage`**

```
Stores the progress of a run in progress — which action is running and how many items it has
removed — in session storage. Manifest V3 stops and restarts the background worker while a run
is going, and without this the count and the target tab are lost every time it does. It is
cleared when the browser closes and holds no content from any page.
```

**`tabs`**

```
Used to find the tab to work in and to drive it to the list being emptied — the user's replies
page, their likes page, their Liked videos playlist — and to reload it when the user presses
Stop, which is what ends a run. Browsing history is never read; the extension only ever touches
the tab it was asked to work in.
```

**Host permission — `https://x.com/*`**

```
The items being deleted are on this site, and deleting one means clicking its menu, then the
delete entry, then the confirmation, in the user's own signed-in session. There is no API path
to the same result that does not cost the user a paid X subscription.
```

**Host permission — `https://www.youtube.com/*`**

```
Liked videos are removed from the user's Liked videos playlist on this site, by the same
click-through the user would perform themselves.
```

**Host permission — `https://myactivity.google.com/*`**

```
YouTube comments are not deletable from youtube.com. They are listed and deleted on Google My
Activity, which is where this permission points. The extension touches nothing else on that
site.
```

### Remote code

```
No, I am not using remote code.
```

Everything is bundled. This has to stay true — a CDN import added later turns the answer into a
lie and the review into a takedown.

### Data usage

Every category is answered **not collected**: personally identifiable information, health
information, financial information, authentication information, personal communications,
location, web history, user activity, website content.

The three certifications are all true as the code stands, and each one is a promise about
future versions as much as this one:

- not being sold to third parties
- not being used or transferred for a purpose unrelated to the item's single purpose
- not being used or transferred to determine creditworthiness or for lending

### URLs

| Field          | Value                                                               |
| -------------- | ------------------------------------------------------------------- |
| Privacy policy | https://github.com/thorstenalpers/CleanMyPosts/blob/main/PRIVACY.md |
| Homepage       | https://github.com/thorstenalpers/CleanMyPosts                      |
| Support        | https://github.com/thorstenalpers/CleanMyPosts/issues               |

A privacy policy URL is mandatory as soon as any permission is requested. `PRIVACY.md` in the
repository root is that policy.

---

## Firefox (addons.mozilla.org)

AMO reuses the summary and description above. What it asks for separately:

- **Source code.** Because the submitted build is minified and bundled, AMO requires the source
  and exact build instructions. `npm ci && npm run build:extension` reproduces
  `dist/extension/firefox/` from a clean checkout; point the reviewer at
  [extension/README.md](README.md).
- **Add-on id** — `cleanmyposts@thorstenalpers.com`, already in the built manifest.
- **Reviewer notes.** Say plainly that the add-on automates clicking on the user's own account
  pages and why. A reviewer who works that out for themselves reads it as concealment.

---

## Open questions

- **`tabs` may be removable.** Chrome only requires it to read a tab's `url`, `title`,
  `pendingUrl` or `favIconUrl`, and `background.ts` reads none of those — it uses `tab.id`,
  `tabs.update`, `tabs.reload` and `tabs.sendMessage`, all of which the host permissions
  already cover. Dropping it would remove a permission warning and a justification from the
  review. Untested: verify against a loaded build before changing the manifest.
- **Store acceptance is unproven.** An extension that clicks through x.com on the user's behalf
  runs into the platform's own rules on automation. Both stores may reject it, and Chrome may
  remove it later. Nothing here changes that; it only makes sure a rejection is about the
  substance rather than a thin listing.
