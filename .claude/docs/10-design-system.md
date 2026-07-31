# Design System

Classic black and white. The base is shadcn-svelte in the `new-york` style with
`baseColor: neutral` — there every token has chroma 0, i.e. true greys.

## The principle

**The only color in the app is the warning color.**

All tokens are neutral (`oklch(… 0 0)`); the sole exception is `--destructive`. That way
color in this UI always means exactly one thing: something is about to be deleted
irreversibly here. This is not a style choice but part of the safety concept — so it must
not be softened.

No brand color, no accent blue, no colored charts, no green success badges. Status is
distinguished by shape, position, and text, not by hue.

## Tokens

Defined in `src/app.css` as CSS variables, mirrored into Tailwind via `@theme inline`.
`:root` is light, `.dark` is dark; switched via `mode-watcher`.

Use **only** the semantic classes: `bg-background`, `text-foreground`,
`text-muted-foreground`, `bg-card`, `border-border`, `bg-destructive`.

Forbidden: raw color values (`bg-zinc-800`, `#111`), manual `dark:` color overrides.
If you need `dark:` for a color, you are using the wrong token.

`--radius: 0.5rem`. Other radii only via `rounded-sm/md/lg/xl`.

## Typography

One family: the system UI font. No web fonts — the app runs offline and should feel like a
Windows tool, not a website.

| Role | Class |
|---|---|
| Page title | `text-2xl font-semibold tracking-tight` |
| Section | `text-lg font-medium` |
| Body | `text-sm` |
| Secondary | `text-sm text-muted-foreground` |
| Numbers, IDs, paths | `font-mono text-xs tabular-nums` |

`tabular-nums` is mandatory on anything that changes live — progress counters that jump as
they climb look broken.

## Layout

- Spacing in multiples of 4. Card padding `p-4`, section gap `gap-6`.
- **No `space-x-*` / `space-y-*`.** Always `flex` with `gap-*`, vertical `flex flex-col gap-*`.
- `size-*` when width and height are equal — not `w-10 h-10`.
- `truncate` instead of the three-part `overflow-hidden text-ellipsis whitespace-nowrap`.
- `class` on components controls layout, never colors or typography.

## States and motion

Skeletons instead of spinners where the shape of the data is known. Spinners only for
indeterminate waits, and never without a way to cancel.

Transitions are short (150–200 ms) and limited to `opacity` and `transform`. Nothing moves
while the user is reading. Progress bars are the only element with continuous motion.

## Accessibility

- Interactive elements are keyboard reachable; the focus ring via `outline-ring/50` is
  visible.
- Icon-only buttons need an `aria-label`.
- Contrast at least AA — with pure greys, `text-muted-foreground` on `bg-muted` is where it
  regularly slips.
- The a11y addon in Storybook is the check, not eyeballing.
