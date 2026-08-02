# Design System

A neutral greyscale base with exactly two colours that carry meaning. The base is
shadcn-svelte in the `new-york` style with `baseColor: neutral` — there every token has
chroma 0, i.e. true greys.

## The principle

**Two colours, two meanings. Nothing else is coloured.**

| Colour      | Meaning                                       | Token                                   |
| ----------- | --------------------------------------------- | --------------------------------------- |
| Destructive | something is about to be deleted irreversibly | `--destructive`                         |
| Accent      | _you are here_ / _this is the primary action_ | `--accent-base` → `--primary`, `--ring` |

Everything else is neutral (`oklch(… 0 0)`). Red must never be used for anything but
deletion — that is part of the safety concept, not a style choice. The accent is
user-chosen, so it must never be the only signal for a state: selection and focus are also
carried by shape, position, and text.

No colored charts, no green success badges, no coloured status dots.

> Earlier revisions of this document forbade any accent colour at all. That was relaxed when
> the accent became user-configurable; the destructive-red rule was not.

## Tokens

Defined in `src/app.css` as CSS variables, mirrored into Tailwind via `@theme inline`.
`:root` is light, `.dark` is dark; switched via `mode-watcher`.

Use **only** the semantic classes: `bg-background`, `text-foreground`,
`text-muted-foreground`, `bg-card`, `border-border`, `bg-destructive`, `bg-primary`.

Forbidden: raw color values (`bg-zinc-800`, `#111`), manual `dark:` color overrides.
If you need `dark:` for a color, you are using the wrong token.

`--radius: 0.75rem`. Other radii only via `rounded-sm/md/lg/xl`.

### Accent tokens

Three variables are written at runtime by `$lib/theme/accent.ts` and must not be hard-coded
in CSS:

| Variable              | Derived from the user's hex accent                              |
| --------------------- | --------------------------------------------------------------- |
| `--accent-base`       | the colour converted to OKLCH                                   |
| `--accent-base-hover` | same hue and chroma, lightness −0.06                            |
| `--accent-on`         | near-white, or near-black when the accent's lightness is > 0.68 |

OKLCH is used because lightness is perceptually uniform there: the hover shade and the
on-accent text colour stay legible for any hue the user picks. `--primary` and `--ring`
reference `--accent-base` in both light and dark mode.

## Typography

One family: the system UI font. No web fonts — the app runs offline and should feel like a
Windows tool, not a website.

| Role                | Class                                   |
| ------------------- | --------------------------------------- |
| Page title          | `text-2xl font-semibold tracking-tight` |
| Section             | `text-lg font-medium`                   |
| Body                | `text-sm`                               |
| Secondary           | `text-sm text-muted-foreground`         |
| Numbers, IDs, paths | `font-mono text-xs tabular-nums`        |

`tabular-nums` is mandatory on anything that changes live — progress counters that jump as
they climb look broken.

## Components

Layout-bearing components live in `src/lib/components/` and take props in, events out —
never the bridge. The set that carries the app's identity:

| Component                         | Role                                                                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `sidebar-shell`                   | Nav rail. Active item marked by a 3px accent rail **and** `aria-current`, plus an optional connection dot. Expanded 240px / collapsed 56px. |
| `action-row`                      | One delete-able category. Show + Delete buttons stay in the layout at all times and only gain contrast on hover, so rows never reflow.      |
| `run-status`                      | Pinned above the sidebar footer while a deletion runs: label, running count, indeterminate progress, Stop. Survives navigating away.        |
| `setting-section` / `setting-row` | Settings grouping. Every row carries a visible description — a toggle that deletes data must say so before it is flipped.                   |
| `accent-picker`                   | Eight presets, a hex field, and a "follow Windows" switch.                                                                                  |

## Layout

- Spacing in multiples of 4. Card padding `p-4`, section gap `gap-6`.
- **No `space-x-*` / `space-y-*`.** Always `flex` with `gap-*`, vertical `flex flex-col gap-*`.
- `size-*` when width and height are equal — not `w-10 h-10`.
- `truncate` instead of the three-part `overflow-hidden text-ellipsis whitespace-nowrap`.
- `class` on components controls layout, never colors or typography.

### The title-bar strip

The window keeps the standard system title bar; the host does not extend into it and owns no
drag region. `+layout.svelte` reserves a 40px strip at the top of the shell (`h-10`) holding the
word mark, directly below the system title bar.

`body` has no background of its own; the app shell paints `bg-background`. Do not build a
design that depends on translucency — WebView2 paints opaque, so a window-level backdrop
material would not show through the page anyway.

## States and motion

Skeletons instead of spinners where the shape of the data is known. Spinners only for
indeterminate waits, and never without a way to cancel.

The start-up placeholder is deliberately **static** — no shimmer, no animation. It is a CSS
`#app:empty` rule in `src/app.html` covering the gap between "page painted" and "Svelte
mounted". Theme-aware neutral fills, so it is correct in light and dark without extra work.

Transitions are short (150–200 ms) and limited to `opacity` and `transform`. Nothing moves
while the user is reading. Progress bars are the only element with continuous motion.

## Accessibility

- Interactive elements are keyboard reachable; the focus ring via `outline-ring/50` is
  visible.
- Icon-only buttons need an `aria-label`. The accent swatches are icon-only — they carry
  both `aria-label` and `aria-pressed`.
- Contrast at least AA — with pure greys, `text-muted-foreground` on `bg-muted` is where it
  regularly slips. For the accent, `--accent-on` is what keeps the primary button legible;
  do not replace it with a fixed white.
