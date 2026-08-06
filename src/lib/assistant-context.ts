/**
 * What a question is asked against.
 *
 * Four parts, all of which the app can vouch for. The instructions, the description and the
 * troubleshooting notes are written here rather than fetched, so the model is told what the
 * app does and how it usually fails instead of guessing from the log. The log is the only
 * runtime data that goes out, and it is the one thing this app already guarantees is free of
 * post content, handles, cookies and tokens — see `.agents/docs/12-testing-and-quality.md`.
 *
 * The user can read the whole thing before sending it: the assistant's preview renders these
 * same sections, so nothing about the request is only visible from here.
 */
import type { LogEntry } from '$lib/bridge/contract';
import { X_GROUPS, YOUTUBE_GROUPS } from '$lib/actions';
import { siteConfig } from '$lib/engine/config';

/** The last stretch of the log; older lines rarely explain the run being asked about. */
const LOG_LINES = 200;

function describeRole(language: string): string {
	return [
		'You are the support assistant built into CleanMyPosts. You answer questions about',
		'this app and about the log the user is looking at, and nothing else.',
		'',
		'Use only what is below. If the log does not say why something happened, say so rather',
		'than inventing a cause. Where the troubleshooting notes cover the case, give the fix',
		'they name. Keep it short: a few sentences, or a short list of steps.',
		`Write the answer in ${language}.`
	].join('\n');
}

function describeApp(): string {
	const x = X_GROUPS.map((group) => group.key).join(', ');
	const youtube = YOUTUBE_GROUPS.map((group) => group.key).join(', ');
	return [
		'## The app',
		'',
		'CleanMyPosts is a Windows desktop app that bulk-deletes a user’s own content on',
		'social platforms. It uses no platform API: it drives an embedded browser and clicks',
		'the same buttons a person would, so it only ever works inside a session the user is',
		'already signed in to.',
		'',
		`On X it can delete: ${x}.`,
		`On YouTube it can delete: ${youtube}.`,
		'',
		'Deletion is deliberately slow. Configurable waits sit after each page load, after each',
		'deleted item, and between retries; they are the only brake against the platform',
		'flagging the run as automation. Raising them is always safe.',
		'',
		'Nothing about the user is stored: no database, no export, no copy of any post. The',
		'only files written are the app’s own settings and its window geometry. The sign-in',
		'lives in the embedded browser’s cookie store, which the app never reads.'
	].join('\n');
}

/**
 * The same cases as the README's troubleshooting section, condensed.
 *
 * Kept beside the description rather than fetched from GitHub: an answer must not depend on
 * the network, and this app is expected to be useful with none.
 */
function describeTroubleshooting(): string {
	return [
		'## What usually goes wrong, and the fix',
		'',
		'- Nothing is deleted and the log ends with "No scroll change; assuming no more posts":',
		'  the page had nothing to act on — signed out, or a profile that is not the user’s.',
		'  Sign in in the app’s browser pane; the sidebar dot shows the state.',
		'- A run deletes a few items and stops: the platform is throttling the session. Raise',
		'  the waits (between deletions to 1500 ms or more, after a page load to 5000 ms) and',
		'  wait a few minutes before the next run.',
		'- The browser pane stays blank: the WebView2 runtime is missing, or the platform',
		'  answered with an interstitial (consent, captcha, re-login) that has to be clicked',
		'  through once by hand.',
		'- A cookie banner covers the page: the app dismisses banners itself, preferring the',
		'  rejecting button, but an unknown wording gets through and has to be clicked once.',
		'- "Deletion failed." on every item: the platform changed its markup and the engine’s',
		'  buttons moved. Update to the latest release; if it persists it is a bug worth',
		'  reporting with the log.',
		'- Some likes or followings survive: not everything is reachable from the list',
		'  (protected accounts, items behind "Show more"). Running the action again clears',
		'  most of it.',
		'- YouTube comments unreachable: My Activity wants the Google sign-in again.',
		'- "No source is set up": neither Claude Code nor a provider key was found in the',
		'  settings — that is about this assistant, not about a deletion.',
		'',
		'Deletions cannot be undone, and nothing is kept that could restore them.'
	].join('\n');
}

function describeLog(entries: LogEntry[]): string {
	if (entries.length === 0) {
		return ['## The log', '', 'The log is empty — nothing has run yet in this session.'].join('\n');
	}

	const recent = entries.slice(-LOG_LINES);
	const skipped = entries.length - recent.length;
	const lines = recent.map((entry) => `${entry.timestamp} ${entry.level}: ${entry.message}`);
	return [
		'## The log',
		'',
		skipped > 0
			? `The last ${recent.length} lines (${skipped} older ones omitted):`
			: 'Every line so far:',
		...lines
	].join('\n');
}

/**
 * Where to read the code this is being asked about.
 *
 * Named rather than pasted: the local Claude Code binary is running on the machine that has
 * the checkout, so a path is worth more to it than an excerpt, and a hosted model can be
 * pointed at the same paths on GitHub. Every file named here is one this repository actually
 * keeps.
 */
function describeSource(): string {
	return [
		'## Where the code is',
		'',
		'The app is open source: https://github.com/thorstenalpers/CleanMyPosts',
		'',
		'- `AGENTS.md` in the repository root is the orientation document — what the app is,',
		'  which layer does what, and where each thing lives.',
		'- `.agents/docs/` holds the detail, one file per subject.',
		'  `04-content-script.md` describes the delete engine below.',
		'- `src/lib/engine/` is that engine, in TypeScript: `config.ts` (every selector and word',
		'  it looks for), `dom.ts` (clicking, waiting, logging), `consent.ts` (cookie banners),',
		'  and one module per action under `x/` and `youtube/`.',
		'',
		'If you can read files on this machine, read them before answering about the code:',
		'start at `AGENTS.md`, then the file under `src/lib/engine/` that matches the action in',
		'question. Do not guess at an implementation that is one `Read` away.'
	].join('\n');
}

/**
 * What the model has to know to write a patch: the live configuration, and the one shape the
 * app can actually run.
 */
function describePatchTask(): string {
	return [
		'## Write a patch for the delete engine',
		'',
		'The user says the platform page does not look the way the engine expects — usually',
		'because their language or region words a menu item differently.',
		'',
		'The app evaluates your answer inside the platform page before the next run.',
		'`window.__cmp.config` is a plain mutable object; this is its current content:',
		'',
		'```json',
		JSON.stringify(siteConfig, null, 2),
		'```',
		'',
		'Answer with JavaScript only — no markdown fence, no explanation around it, nothing',
		'that is not runnable. Change the least that solves it: push the wording the user',
		'reports onto the matching array, or reassign the one selector that moved. Do not',
		'redefine `window.__cmp`, do not fetch anything, do not add listeners, and do not',
		'delete entries that are already there — another language depends on each of them.',
		'',
		'Example of a whole good answer:',
		"window.__cmp.config.youtube.removeFromLikedText.push('beğenilenlerden kaldır');"
	].join('\n');
}

/**
 * What the model has to produce for a bug report: one line of title, then a body a stranger
 * can act on. The app never files it — it fills the form and the user presses the button on
 * GitHub, which is also why the model is told the text will be public.
 */
function describeReportTask(appVersion: string): string {
	return [
		'## Write a bug report',
		'',
		'The user hit something that looks like a defect. Turn the log and their description',
		'into a report a maintainer can act on without asking a follow-up question.',
		'',
		'Answer in exactly this shape and nothing else:',
		'- The first line is the title. One sentence, no markdown, no "Bug:" prefix.',
		'- Every line after it is the body, in markdown.',
		'- The body is never empty, and never the title again: a title on its own is the one',
		'  report a maintainer cannot act on.',
		'',
		'The body carries, in this order: what the user expected and what happened instead; the',
		'steps that reach it; the platform and action involved; and the log lines that matter,',
		'in a fenced block — the ones that show the failure, not all of them.',
		'',
		`Environment to state in the body: CleanMyPosts ${appVersion}, Windows, WebView2.`,
		'',
		'This text becomes a public issue on GitHub. Do not include the user’s handle, any post',
		'content, any url that identifies them, or anything else from the log that names a',
		'person — write "the signed-in account" instead. Write the report in English regardless',
		'of the language used above; the repository is English.'
	].join('\n');
}

export type PromptMode = 'question' | 'patch' | 'report';

export interface PromptSection {
	/** A message key, so the preview names the section in the user's language. */
	titleKey:
		| 'assistant.preview.role'
		| 'assistant.preview.app'
		| 'assistant.preview.fixes'
		| 'assistant.preview.source'
		| 'assistant.preview.patch'
		| 'assistant.preview.report';
	body: string;
}

/** The fixed parts, in the order they are sent. The log and the question follow them. */
export function promptSections(
	language: string,
	mode: PromptMode = 'question',
	appVersion = ''
): PromptSection[] {
	return [
		{ titleKey: 'assistant.preview.role', body: describeRole(language) },
		{ titleKey: 'assistant.preview.app', body: describeApp() },
		{ titleKey: 'assistant.preview.fixes', body: describeTroubleshooting() },
		{ titleKey: 'assistant.preview.source', body: describeSource() },
		...(mode === 'patch'
			? [{ titleKey: 'assistant.preview.patch' as const, body: describePatchTask() }]
			: []),
		...(mode === 'report'
			? [{ titleKey: 'assistant.preview.report' as const, body: describeReportTask(appVersion) }]
			: [])
	];
}

export function buildPrompt(
	question: string,
	entries: LogEntry[],
	language: string,
	mode: PromptMode = 'question',
	appVersion = ''
): string {
	return [
		...promptSections(language, mode, appVersion).map((section) => section.body),
		describeLog(entries),
		`## The question\n\n${question.trim()}`
	].join('\n\n');
}

/** Past this GitHub answers the request line with 414, and the report never arrives. */
const MAX_ISSUE_URL = 7000;

function issueUrl(repo: string, title: string, body: string): string {
	return `${repo}/issues/new?${new URLSearchParams({ title, body }).toString()}`;
}

/**
 * The form a maintainer gets when the model wrote no body of its own — a single line goes
 * under the first heading, and the headings that stay empty say what is still missing.
 */
function reportForm(appVersion: string, summary: string): string {
	return [
		'## What happened',
		'',
		summary || '_Describe what you did and what the app did instead._',
		'',
		'## What I expected',
		'',
		'_…_',
		'',
		'## Steps to reproduce',
		'',
		'1. _…_',
		'',
		'## Environment',
		'',
		`- CleanMyPosts ${appVersion || 'version unknown'}`,
		'- Windows, WebView2',
		'',
		'## Log',
		'',
		'_Paste the lines that show the failure from the app’s Log page. This issue is public —_',
		'_check them for your handle and for post content first._'
	].join('\n');
}

/**
 * Splits the model's answer into GitHub's two fields.
 *
 * The issue form is reached through a url, so the whole report travels in the query string
 * and is cut to fit. Filling the form is as far as the app goes: the report is public, and
 * pressing submit stays with the person whose report it is.
 *
 * The body is never left empty and never repeats the title: an answer that came in one line
 * is folded into a report form instead, so what reaches the maintainer reads like a report
 * either way.
 */
export function toIssueUrl(repo: string, answer: string, appVersion = ''): string {
	const text = answer.trim();
	const lines = text.split('\n');

	// An answer that opens with a fence or a blank line still has its title on the first line
	// that carries words.
	let start = 0;
	while (start < lines.length && /^\s*(?:```.*)?$/.test(lines[start] ?? '')) start += 1;

	const title =
		lines[start]
			?.replace(/^#+\s*/, '')
			.replace(/\*\*/g, '')
			.replace(/^(?:title|bug|issue)\s*:\s*/i, '')
			.trim()
			.slice(0, 200) || 'Bug report';

	const rest = lines
		.slice(start + 1)
		.join('\n')
		.trim();
	// A one-line answer has already been used as the title, so repeating it verbatim would be
	// an issue that says the same thing twice. It goes into the form as the summary instead.
	const body = rest || reportForm(appVersion, text);

	const url = issueUrl(repo, title, body);
	if (url.length <= MAX_ISSUE_URL) return url;

	// Encoding decides the real cost of a character, so the cut is measured on the finished
	// url rather than guessed from the body's length.
	const mark = '\n\n_(cut to fit — the rest is in the app’s Log page)_';
	let keep = 0;
	for (let step = body.length; step >= 1; step = Math.floor(step / 2)) {
		while (
			keep + step <= body.length &&
			issueUrl(repo, title, body.slice(0, keep + step) + mark).length <= MAX_ISSUE_URL
		) {
			keep += step;
		}
	}
	return issueUrl(repo, title, body.slice(0, keep) + mark);
}

export { describeLog };
