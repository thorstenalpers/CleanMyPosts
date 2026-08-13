# Store assets

What gets uploaded to the two stores, kept here so the images a listing shows are versioned
with the build they show.

Sizes, counts and what each screenshot is meant to contain are in
[../store-listing.md](../store-listing.md).

## What is here

| File                        | Shows                                                                      |
| --------------------------- | -------------------------------------------------------------------------- |
| `screenshot-1-lists.png`    | The popup at rest — both columns, all seven lists, the two halves of a row |
| `screenshot-2-running.png`  | Folded to its header mid-run: the count, the stop button, over My Activity |
| `screenshot-3-settings.png` | The settings panel: platforms, the three waits, language, theme            |

All three are 1280×800, 24-bit PNG, no alpha channel — which is what Chrome requires and what
the originals failed on. A Windows screenshot carries an alpha channel by default, and the
store rejects the upload for it without looking at the picture.

`scripts/store-screenshots.ps1` produced them from the raw captures. It scales each to fit,
never past 2x, and centres it on a flat background rather than stretching: the sources are
1.59, 2.47 and 1.13 to one, and forcing them to 1.6 would show. The 2x ceiling is because these
are screenshots of text.

AMO takes the same three files.

## Still missing

- Two more screenshots — Chrome allows five and prefers them: the confirmation dialog for
  **Delete everything**, and a finished run with the log open.
- `promo-440x280.png`, which Chrome needs before the item can be featured, and the optional
  `promo-1400x560.png`.

Screenshots have to show the real extension and carry no real account content — a store
screenshot is a permanent, indexed copy of whatever is on it.
