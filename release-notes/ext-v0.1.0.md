### What's Changed

The delete engine, in a browser instead of a window. Same selectors, same retry loop, same
deliberate slowness — the app's engine is shared code here, not a second implementation.

**First build**

- New: A Chrome and a Firefox extension, both built from `src/lib/engine/`. Deleting posts,
  replies, reposts, likes and followings on X, and comments and liked videos on YouTube.
- New: A popup that starts one action, shows what it has removed so far, and stops it. Stopping
  reloads the tab, which is what ends a run — the engine has no way to interrupt one.
- New: The background worker finds your handle on the page and drives the tab to the right list
  itself, the same way the desktop host does.

**Known limits**

- Settings are not there yet: the waits are the defaults and cannot be changed from the UI.
- The assistant, action plans and **Delete everything** are desktop-only for now.
- Neither store has accepted this. It is a build you load yourself, and whether it can ship
  under the platforms' rules on automation is unproven.
