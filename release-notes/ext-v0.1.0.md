### What's Changed

The delete engine, in your own browser instead of a window. Not a port and not a second
implementation: `src/lib/engine/` is the same code the desktop app runs, so a selector fixed
for one is fixed for both in the same commit.

**What it deletes**

- New: Posts, replies, reposts, likes and accounts you follow on X.
- New: Comments and liked videos on YouTube — on Google My Activity, where both lists actually
  live, which means disliked videos go with them.
- New: **Delete everything**, one button per platform, behind a dialog that names the lists it
  is about to empty.

**The popup**

- New: A row opens that list on the platform; the bin beside it empties the list. Two halves,
  because a button labelled after a list should show you the list.
- New: A run folds the window down to its header, where the count and the stop button are.
  A chevron brings the rest back, and it stays as you left it.
- New: Settings for which platforms to show, the three waits the app also exposes, a light and
  dark theme, and the twelve languages the app ships. All of it kept between sessions.
- New: The log starts collapsed under everything else, since it matters when something has
  gone wrong rather than when it has not.

**How a run works**

- The background worker does what the desktop host does: read your handle off the page, drive
  the tab to the right list, ask for the run, relay what comes back. The retry loop itself runs
  in the page, which is what makes Chrome stopping the worker mid-run harmless.
- Stopping reloads the tab. The engine has no way to interrupt a run, so taking the page away
  is what ends it.
- Deletion is as deliberately slow here as it is in the app. The pauses are the only brake
  against the platform reading the session as automation.

**What it does not do**

- No account, no server, no analytics, and nothing written down. The only thing stored is which
  action is running and how far it has got, in memory, until the browser closes.
- No remote code: everything it runs ships inside the package.
- It runs on x.com and Google My Activity, and on no other site.

**Not here yet**

- The assistant, action plans and saved actions are desktop-only.
- Neither store has accepted this. It is a build you load yourself; whether it can ship under
  the platforms' own rules on automation is unproven.
- Firefox is untested. `world: "MAIN"`, which the engine needs to be reachable from the
  console, arrived in Chrome first and its Firefox support is not established here.
