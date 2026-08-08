# Assistant

Answers two kinds of question — what this app does, and what just happened in the log — and
writes **action plans** for lists the engine does not already handle. It is optional in every
direction: hideable in the Navigation settings, and useless until the user picks a source.

Two surfaces, one implementation. The **page** at `/assistant` is the long form: modes, the
request preview, the bug-report hand-off, the Claude Code hand-off. The **panel** opens from
the sparkles icon in the header and lives in the column the app owns, beside the action rail.
That is not a layout preference — the platform page is a webview laid on top of the chrome, so
anything floating over it is either painted behind it or has to push it off screen. Beside it
is the only arrangement where somebody can look at the page they are asking about.

The panel keeps a conversation and folds it into each request as one more section; `assistant.ask`
is a single round trip with no memory of its own. Both surfaces share `plan-actions.svelte`,
because the order of those four buttons is a judgement about safety and it must not be right in
one place and wrong in the other.

## Where an answer comes from

Two kinds of source, and the choice is the user's:

- **`claude-code`** (the default) — the Claude Code binary already on the machine, run as
  `claude --print --output-format text` with the prompt on stdin. On the argument list it
  would hit both a length limit and a quoting problem; the prompt carries the log. No key,
  and nothing leaves this app: whatever that binary does with the network is its own
  business, under the user's own account.
- **A hosted provider** — Google AI, Groq, OpenAI, Anthropic or Mistral. Needs an API key,
  and is the only thing in this app that puts data on the network on purpose.

The table lives in `src-tauri/src/assistant/providers.rs`. Google AI and Groq hand out a free
key, so they come first and carry a link to their key page. Three of the five speak OpenAI's
dialect; Gemini and Anthropic each want their own request body, which is why the request is
built per family rather than per provider.

## What a question carries

Built in `src/lib/assistant-context.ts`, and deliberately only these:

1. The instructions: answer from what follows, say so when the log does not explain
   something, and answer in the user's language.
2. A fixed description of the app — what it deletes on each platform (read from the same
   `$lib/actions.ts` table the buttons use, so the list cannot drift), and why deletion is
   slow.
3. The known failures and their fixes — the same cases as the README's troubleshooting
   section, condensed. Written here rather than fetched: an answer must not depend on the
   network, and both copies are meant to be edited together.
4. The tail of the log buffer, at most 200 lines, with a note saying how many older ones were
   dropped so the prompt cannot grow with the session.
5. The question.

It also carries **where the code is**: the repository URL, `AGENTS.md`, `.agents/docs/`, and
the files under `src/lib/engine/`. The local source runs on the machine that has the
checkout, so a path is worth more to it than a pasted excerpt — it is told to read the file
rather than guess at it.

**Plan mode** adds three sections: the step vocabulary with a worked example, the engine's own
likes module for the platform in question (imported with `?raw`, so it cannot drift from what
runs), and a redacted skeleton of the open page.

## Plans

The answer is not code. It is a JSON object over a fixed vocabulary — `click`, `waitFor`,
`waitGone`, `scrollUntil`, `wait` — checked against `ActionPlanSchema` before anything runs.
That check is the whole guarantee: a wrong plan can only ask for things the engine could
already do, and nothing a model produced is ever evaluated inside the signed-in session.

Elements are named by selector and by the word they carry, **never by index**. An index refers
to the snapshot the model was shown and means something else on the next render, which is
exactly why recorded browser-agent runs stop working; a test holds the schema to refusing one.

The plan says how _one_ item goes away. Repeating, counting, the waits between deletions, the
stop button and the shield stay with the app — they are what makes a run slow enough not to be
flagged and stoppable while it goes, and none of that is a model's decision.

Three things can be done with a plan, in this order. **Check first** counts what the target
finds and touches none of it. **Run once** runs it on the page that is already open, through
the same runner and the same stop button as a built-in action. **Keep as action** asks for a
name and puts it in that platform's panel, where it runs like any other row — and stays out of
"Delete everything", because it goes stale on its own schedule. The settings list every kept
plan with the day it was kept, which is the fact that decides whether it still works.

Saving an answer as the raw engine script is still there, unchanged, for what the vocabulary
does not cover.

**The request can be read before it is sent.** The page's preview renders exactly these
sections, built by calling the same functions `buildPrompt` calls — a preview assembled
separately would be a second description of the request, and the one thing it must not be is
approximately right. A test asserts each section it shows is contained in the prompt.

The troubleshooting guide is named above the page's own heading, with a button into the
README section on GitHub: most people arrive here after something failed, and the written
answer is faster than asking for it.

For a question or a report, the log is the only runtime data that goes out, and it is the one
thing the project already guarantees carries no post content, handles, cookies or tokens — see
[12-testing-and-quality.md](12-testing-and-quality.md#logging).

Asking for an action plan adds a text-free skeleton of the open page, because a selector
cannot be written against a page nobody has seen. It is redacted in the site webview by
`src/lib/engine/structure.ts` before it crosses the bridge, and the preview shows it verbatim
before anything is sent. [13-security-and-privacy.md](13-security-and-privacy.md) rule 5 has
the full account of what survives that and what does not.

Still not sent, in any mode: the signed-in name, the settings, and the site DOM as it is.

## The key

In the Windows Credential Manager under service `CleanMyPosts`, one entry per provider id.
Never in `settings.json`, which is preferences and is protected against nothing.

The key never crosses to the frontend. `assistant.getSources` reports `hasKey` and nothing
more, the HTTP request is made in the host so the key is read only at the moment it is used,
and any error on the way back has the key string replaced with `***` before the window sees
it. Storing an empty key deletes the entry — that is what the dialog's Forget button sends,
and it is the only way a key ever leaves.

## Proving it works

`candidates()` is a claim about where Claude Code installs itself, and stdin-in/stdout-out is
a claim about how it behaves. Neither survives a unit test, so there is one integration test,
ignored by default because it spends a turn:

```bash
cargo test --manifest-path src-tauri/Cargo.toml -- --ignored answers_from_the_real_cli
```

There is no equivalent for the hosted side — it would need a real key and would bill the
person running it.

## Files

| Where                                       | What                                             |
| ------------------------------------------- | ------------------------------------------------ |
| `src-tauri/src/assistant/mod.rs`            | routes a question to the chosen source           |
| `src-tauri/src/assistant/cli.rs`            | locating and running the local binary            |
| `src-tauri/src/assistant/providers.rs`      | the provider table, the dialects, the HTTP call  |
| `src-tauri/src/assistant/secrets.rs`        | the credential store                             |
| `src-tauri/src/commands/assistant.rs`       | the four bridge methods                          |
| `src/lib/assistant-context.ts`              | the prompt, and reading an answer back as a plan |
| `src/lib/engine/plan.ts`                    | running a plan in the site page                  |
| `src/lib/engine/structure.ts`               | the redacted page skeleton                       |
| `src/lib/views/assistant-view.svelte`       | the page                                         |
| `src/lib/views/assistant-panel.svelte`      | the column beside the platform                   |
| `src/lib/components/plan-actions.svelte`    | check, run, keep — shared by both surfaces       |
| `src/lib/components/api-keys-dialog.svelte` | provider picker, key field, free-key links       |
