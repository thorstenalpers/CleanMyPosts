# Using This Setup as a Template

The layout — `AGENTS.md` in the root, details under `.agents/docs/`, skills under
`.agents/skills/` — is tool-agnostic and not tied to CleanMyPosts.

## Why this shape

- **`AGENTS.md` in the root** is the entry point several agent tools read. It stays short:
  purpose, stack, commands, hard rules, and a pointer table. Whatever must always hold lives
  here — everything else is linked.
- **`CLAUDE.md`** only points at `AGENTS.md`. One source, no reconciling two files.
- **`.agents/docs/`** is read selectively. An agent working on the bridge does not need the
  design system in context. Hence the pointer table in `AGENTS.md`: it says when to read
  what.
- **Numbered file names** keep the order stable and links durable.

## Adopting it

1. Copy `.agents/` and `AGENTS.md` into the new repo.
2. Delete and rewrite every file with scope `project` (see [README.md](README.md)).
3. Files with scope `adapt` keep the structure; replace the content.
4. Files with scope `generic` stay as-is — usually a few paths are enough.
5. In `AGENTS.md`, adjust the stack table, commands, hard rules, and pointer table.
6. Create `CLAUDE.md` in the root:

   ```markdown
   See [AGENTS.md](AGENTS.md).
   ```

## What is transferable

| File | Transferable because |
|---|---|
| `11-frontend-conventions.md` | Svelte 5 runes, the shadcn-svelte import style, and the required stories hold in any Svelte project |
| `12-testing-and-quality.md` | test split, CI scope, and the log rules are project-independent |
| `10-design-system.md` | the structure (tokens, typography, layout, motion, a11y) stays; only the color statement changes |
| `02-bridge-contract.md` | valid anywhere a WebView2 app talks to a host |
| `README.md` | index and maintenance rules |

## Rules that keep the setup healthy

- **`AGENTS.md` stays under ~100 lines.** It loads on every request. When it grows, content
  moves into `docs/`.
- **One file, one topic.** Past ~250 lines, split.
- **No code duplication in the docs.** Signatures and file lists go stale on the first
  refactor. Describe rules and intent, not the code.
- **External facts get a checked-on date.** Prices, rate limits, export formats, and DOM
  selectors change. Without a date nobody knows whether the claim still holds.
- **What should not be done is as important as the opposite.** The "non-goals" and "what
  there is not" sections prevent more wasted work than any how-to.
- **Language:** docs, comments, and diagram labels are English; see the language rule in the
  global `~/.claude/CLAUDE.md`.
