### What's Changed

The first update since the stores took 1.0.0. Two things, one of which is why the other
exists.

**Reposts moved, the extension follows**

- Fix: X moved reposts off the profile timeline into a Reposts tab of their own. Deleting
  reposts still opened the profile, found nothing there that could be unretweeted, and
  reported nothing to remove. The extension now opens `x.com/<user>/reposts`, which is where
  the reposts went.

**The pages are yours to point**

- New: The popup's settings panel lists the page every action runs on — X posts, replies,
  reposts, likes and following, YouTube comments and likes — and lets you change any of
  them. `{user}` stands for the signed-in handle. Clearing a field brings back the built-in
  page, and one button resets them all.
- The point of it: when a platform moves a page again, the fix is a settings field, not a
  wait for the next store review.

**Version**

- `1.0.0` → `1.1.0`. There was a `1.0.1` carrying the repost fix on its own; it never reached
  the stores, so this is the first build that does.

Same engine as the desktop app's v3.6.0.
