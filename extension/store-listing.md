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

Chrome allows 132 characters, AMO 250. The same line fits both, and one line that is true in
both places is worth more than two that have to be kept in step.

`using 115 of Chrome's 132`

```
Bulk-delete your posts, replies, reposts, likes and followings on X, and your comments and liked videos on YouTube.
```

Naming both lists separately is the point of the length. "posts, replies, reposts, likes and
followings on X or YouTube" is shorter and says the extension deletes reposts and followings on
YouTube, which it cannot — there are none. A summary that promises a platform's features
wrongly is the first thing a reviewer checks and the first thing a user is annoyed by.

If it has to be shorter, this stays true at 97:

```
Bulk-delete what you posted, liked and followed on X, and your YouTube comments and liked videos.
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
• Liked and disliked videos

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

It runs on x.com and on Google My Activity — where YouTube keeps both the comments and the
liked videos — and on no other site.

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

| Asset              | Chrome                                          | AMO                                 |
| ------------------ | ----------------------------------------------- | ----------------------------------- |
| Store icon         | 128×128 PNG (artwork within 96×96)              | 32×32 and 64×64, PNG or JPEG        |
| Screenshot         | 1280×800 or 640×400, square corners, full bleed | 1280×800 recommended, 1.6:1         |
| How many           | at least 1, at most 5 — five is what to aim for | no practical limit, one per feature |
| Small promo tile   | 440×280                                         | —                                   |
| Marquee promo tile | 1400×560, optional                              | —                                   |

**Formats:** neither store documents what a screenshot may be. Both upload forms take PNG and
JPEG; nothing suggests an animated format is accepted, and a store that downscales every
screenshot to 640×400 for display is not the place to rely on one. Chrome takes a YouTube link
for anything that has to move. AMO shows one set of screenshots to every locale — only their
captions are translated.

The store rejects screenshots that are mostly text, and they have to show the extension itself
rather than a mock-up. Five worth having, in order:

1. The popup open over a platform page, both columns, nothing running — the seven lists at a
   glance, and the two halves of a row.
2. Mid-run: folded to its header with the count climbing and the stop button, the broom pointer
   on the page behind it.
3. The confirmation for **Delete everything**, which names the lists it is about to empty.
4. The settings panel: platforms, the three waits, theme, language.
5. A finished run with the log open under it.

Every screenshot needs the account content in it blurred or replaced with a throwaway account.
A store screenshot is a permanent, indexed copy of whatever is on it.

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
Used to find the tab to work in, to drive it to the list being emptied, and to reload it —
both when the user presses Stop, which is what ends a run, and when an action has to run twice
on a freshly loaded page. That reload needs the tab's current address to compare against the
target: navigating a tab to the address it already shows may start no load at all, and the
extension would then wait forever for one to finish. No browsing history is read and no other
tab is looked at.
```

**Host permission — `https://x.com/*`**

```
The items being deleted are on this site, and deleting one means clicking its menu, then the
delete entry, then the confirmation, in the user's own signed-in session. There is no API path
to the same result that does not cost the user a paid X subscription.
```

**Host permission — `https://myactivity.google.com/*`**

```
Both YouTube lists this extension deletes live here, not on youtube.com: comments and liked
videos are listed on Google My Activity and removed with the button next to each entry. The
extension opens only those two pages and touches nothing else on the site.
```

### Remote code

```
No, I am not using remote code.
```

Everything is bundled. This has to stay true — a CDN import added later turns the answer into a
lie and the review into a takedown.

### Data usage

AMO reads this off the manifest rather than a form: `data_collection_permissions.required` is
`["none"]`, which is the one value that cannot be listed beside another, and a submission
without the key at all is now rejected outright. `build-extension.mjs` writes it into the
Firefox manifest.

Chrome asks the same question as a form. Every category is answered **not collected**: personally identifiable information, health
information, financial information, authentication information, personal communications,
location, web history, user activity, website content.

The three certifications are all true as the code stands, and each one is a promise about
future versions as much as this one:

- not being sold to third parties
- not being used or transferred for a purpose unrelated to the item's single purpose
- not being used or transferred to determine creditworthiness or for lending

### Privacy policy

Chrome takes a URL. **AMO takes the text itself**, in a field on the submission form — this is
what goes in it. `PRIVACY.md` in the repository root is the same statement covering both
products, and is what the Chrome URL points at; the two have to be kept saying the same thing.

```
CleanMyPosts collects nothing, sends nothing anywhere, and has no server. There is no
account to create and no analytics of any kind.

WHAT IT READS

The extension reads the page you have open on x.com or Google My Activity, for as long as
it takes to find the next item and click it away. Nothing it reads is kept after the click
— no post, comment, video title, or any other content from a page is ever written down or
sent anywhere.

WHAT IT STORES

Two things, both in the browser's own extension storage:

Until you close the browser: which action is running, how many items it has removed, the
tab it is working in, and the recent lines of its log. Firefox stops and restarts an
extension's background worker while it is running, and this is what survives that. It also
holds your X handle for the length of a run, because every address the extension navigates
to is built from it — x.com/<handle>/likes and so on. It is never sent anywhere.

Kept between sessions: your own preferences for the popup — which platforms to show, the
three waits, the theme, the language.

WHAT IT SENDS

Nothing. The extension has no server component and contacts no host of its own. It talks
only to the sites you are already signed in to, by being on their pages.

YOUR LOGIN

Your session stays where it was: in the browser's cookie store, exactly as for any other
site. The extension never reads, copies or transmits it.

PERMISSIONS

- storage: the two things above.
- tabs: to find the tab to work in, drive it to the list being emptied, and reload it.
  No browsing history is read and no other tab is looked at.
- Access to x.com and myactivity.google.com: the pages the items are on. Nowhere else.

No part of what the extension runs is fetched at runtime. Everything is in the package you
installed, and all of it is public:
https://github.com/thorstenalpers/CleanMyPosts
```

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

AMO reuses the summary and description above, unchanged — it accepts them as plain text, and
the line breaks and bullets survive. It also allows a little HTML (`<b>`, `<a>`, `<ul>`,
`<code>`), which is worth nothing here: a second copy of the description with tags in it would
be a second thing to keep true, and the first one to go stale.

What it asks for separately:

- **Source code.** Because the submitted build is minified and bundled, AMO requires the source
  and exact build instructions. `npm ci && npm run build:extension` reproduces
  `dist/extension/firefox/` from a clean checkout; point the reviewer at
  [extension/README.md](README.md).
- **Add-on id** — `cleanmyposts@thorstenalpers.com`, already in the built manifest.
- **Reviewer notes.** Say plainly that the add-on automates clicking on the user's own account
  pages and why. A reviewer who works that out for themselves reads it as concealment. Then the
  one warning the validator raises, before they have to ask:

```
The "unsafe assignment to innerHTML" in assets/popup-*.js is Svelte 5's template
instantiation, not a data path. Svelte sets innerHTML on a detached <template> element,
from a string its compiler produced at build time, and routes it through a
trustedTypes policy it registers as "svelte-trusted-html". No value from a page, a
network response or a user reaches it — the popup renders no untrusted content at all.
It cannot be avoided without changing UI frameworks; the same warning appears for every
Svelte extension.
```

- **Minimum versions.** Firefox 140 and Firefox for Android 142, because that is where each
  understood `data_collection_permissions`. `world: "MAIN"` already needed 128.

---

## Open questions

- **Store acceptance is unproven.** An extension that clicks through x.com on the user's behalf
  runs into the platform's own rules on automation. Both stores may reject it, and Chrome may
  remove it later. Nothing here changes that; it only makes sure a rejection is about the
  substance rather than a thin listing.
