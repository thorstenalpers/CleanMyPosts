# Design System

A neutral greyscale surface carrying a strong blue. The base is shadcn-svelte in the
`new-york` style with `baseColor: neutral` — every token there has chroma 0, i.e. true greys
— and the accent is put back on top deliberately, where it means something.

## The principle

**Blue is the app, red is deletion, everything else is neutral.**

| Colour      | Meaning                                       | Token                           |
| ----------- | --------------------------------------------- | ------------------------------- |
| Primary     | _you are here_ / _this is the primary action_ | `--primary`, `--ring`           |
| Destructive | something is about to be deleted irreversibly | `--destructive`                 |
| Brand       | a platform's own mark, nothing else           | `--brand-youtube`, `foreground` |

The base is a strong blue against near-black and white — a tool, not a pastel. Everything
that is not primary, destructive or a brand mark stays neutral (`oklch(… 0 0)`).

**Red is still reserved for deletion as a UI state.** The YouTube mark is red because that is
its logo, not because something is about to be destroyed; it appears only on the icon, never
on a background, a label or a state. No preset may override `--destructive`, and no other
element may borrow red. That distinction is the whole reason a brand row exists in the table
above rather than the rule simply being dropped.

The accent is user-chosen, so it must never be the only signal for a state: selection and
focus are also carried by shape, position, and text.

### Gradients

Two surfaces flow rather than sit in blocks, which is where the app gets its character:

- `.cmp-hero` — the overview's opening band, blue bleeding into near-black. Dark in **both**
  modes on purpose: it carries the app's identity rather than its content, so it should read
  as the same object whether the window around it is light or dark. Its own text colour comes
  with it (`--hero-foreground`), so everything inside uses `text-current/…`.
- `.cmp-sidebar` — the same gradient at a fraction of its strength, so the sidebar and the
  page read as one surface instead of a panel on a background.

`color-mix` for the sidebar is **in sRGB, not oklch**: the oklch path from blue to white
swings through pink, which tinted the entire sidebar in the one colour this app reserves for
deletion.

## Tokens

Defined in `src/app.css` as CSS variables, mirrored into Tailwind via `@theme inline`.
`:root` is light, `.dark` is dark; switched via `mode-watcher`.

Use **only** the semantic classes: `bg-background`, `text-foreground`,
`text-muted-foreground`, `bg-card`, `border-border`, `bg-destructive`, `bg-primary`.

Forbidden: raw color values (`bg-zinc-800`, `#111`), manual `dark:` color overrides.
If you need `dark:` for a color, you are using the wrong token.

`--radius: 0.75rem`. Other radii only via `rounded-sm/md/lg/xl`.

### Colour presets

The accent is not a free-form colour any more: `themePreset` picks one of a fixed set, each
a class on `<html>` in `src/themes.css` overriding `--primary`, `--ring` and the accent
pair. `Default` is the blue declared in `app.css`. See
[09-feature-settings.md](09-feature-settings.md) for the switching mechanics and why they
need a timer rather than only `requestAnimationFrame`.

`--destructive` appears in no preset. A theme must not be able to repaint the one colour
that carries a warning.

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

| Component       | Role                                                                                                                                                                                                                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sidebar-shell` | Nav rail, fold toggle and word mark in its header. The active item slides a 3px accent bar in from the left **and** carries `aria-current`, plus an optional connection dot. Rows lean 2px towards the page they would open and their icon grows with them. Expanded 240px / collapsed 56px. |
| `action-row`    | One delete-able category. Show + Delete buttons stay in the layout at all times and only gain contrast on hover, so rows never reflow.                                                                                                                                                       |
| `run-status`    | Pinned above the sidebar footer while a deletion runs: label, running count, indeterminate progress, Stop. Survives navigating away.                                                                                                                                                         |
| `setting-row`   | One setting inside a settings card. Every row carries a visible description — a toggle that deletes data must say so before it is flipped.                                                                                                                                                   |

Overview and Settings are built from `ui/card`: one card per group, its `CardDescription`
carrying the sentence that used to sit loose in the section body.

## Layout

- Spacing in multiples of 4. Card padding `p-4`, section gap `gap-6`.
- **No `space-x-*` / `space-y-*`.** Always `flex` with `gap-*`, vertical `flex flex-col gap-*`.
- `size-*` when width and height are equal — not `w-10 h-10`.
- `truncate` instead of the three-part `overflow-hidden text-ellipsis whitespace-nowrap`.
- `class` on components controls layout, never colors or typography.

### The title bar

The window keeps the standard system title bar; the host does not extend into it and owns no
drag region. The shell reserves no strip of its own — the word mark rides in the sidebar
header next to the fold toggle, so the sidebar and the site webview start on the same line.

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
- Icon-only buttons need an `aria-label`. Buttons that stand for a choice carry
  `aria-pressed` as well, so the state is not colour alone.
- Contrast at least AA — with pure greys, `text-muted-foreground` on `bg-muted` is where it
  regularly slips. Each preset ships its own `--primary-foreground`; do not replace it with
  a fixed white.
