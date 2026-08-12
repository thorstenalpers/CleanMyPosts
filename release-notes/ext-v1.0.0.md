### What's Changed

The first version meant for the stores. Same engine, same behaviour as `ext-v0.1.0` — that one
was a build to load yourself, and everything in it has since been run against real accounts on
both platforms.

**Version**

- Change: `0.1.0` → `1.0.0`. Nothing about the code changed for it. The number said "not
  finished" about something that deletes exactly what the desktop app deletes, and that is the
  wrong thing to say to somebody deciding whether to point it at their account.

**Since 0.1.0**

- Change: The `www.youtube.com` host permission is gone. Both YouTube lists are on Google My
  Activity, so nothing needed it — one less thing the extension can reach, and one less
  permission to explain.

**What it deletes**

- Posts, replies, reposts, likes and accounts you follow on X.
- Comments and liked videos on YouTube, on Google My Activity — which means disliked videos go
  with them, since that page lists both.
- **Delete everything**, one button per platform, behind a dialog that names the lists it is
  about to empty.

**What it does not do**

- No account, no server, no analytics, and nothing written down. The only thing stored is which
  action is running and how far it has got, in memory, until the browser closes.
- No remote code: everything it runs ships inside the package.
- It runs on x.com and Google My Activity, and on no other site.
