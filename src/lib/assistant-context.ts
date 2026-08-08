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
import {
	ActionPlanSchema,
	type ActionPlan,
	type LogEntry,
	type Platform
} from '$lib/bridge/contract';
import { X_GROUPS, YOUTUBE_GROUPS } from '$lib/actions';
import { siteConfig } from '$lib/engine/config';
// The modules themselves rather than a description of them, so what the model is shown cannot
// drift from what the engine actually runs.
import xLikesSource from '$lib/engine/x/likes.ts?raw';
import youtubeLikesSource from '$lib/engine/youtube/likes.ts?raw';

/** The last stretch of the log; older lines rarely explain the run being asked about. */
const LOG_LINES = 200;

/**
 * Who the model is being asked to be, which is not the same thing in every mode.
 *
 * This used to say "you answer questions… and nothing else", in the user's language, a few
 * sentences — and it said it first, above the task. Asked for a plan, models did what it
 * said: back came a polite clarifying question in German where a JSON object was needed. The
 * task section further down asked for the opposite and lost, because this one is the role.
 */
function describeRole(language: string, mode: PromptMode): string {
	if (mode === 'patch') {
		return [
			'You are the delete engine of CleanMyPosts, writing one action plan.',
			'',
			'Your entire answer is a JSON object over the vocabulary given below. Not prose, not',
			'an explanation, not a question back — data. Where the request leaves something open,',
			'take the reading that matches the page you are shown and write the plan for it.',
			'',
			'The answer is in no human language, so translate nothing into',
			`${language} here. The words in a selector are matched against the page and are copied`,
			'from it exactly as they stand there.'
		].join('\n');
	}

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
 * What the model has to know to write a plan: the vocabulary, the live configuration, and the
 * one rule that decides whether the plan is still worth anything tomorrow.
 */
function describePatchTask(): string {
	return [
		'## Write an action plan',
		'',
		'The user wants something done on the platform page: a list emptied that the engine does',
		'not already handle, a selector fixed that the platform has since moved, or a page or a',
		'button reached that the app does not offer yet.',
		'',
		'You are not writing code. The app does not evaluate anything you send. Answer with a',
		'JSON object over exactly this vocabulary, and nothing else — no prose, no fence:',
		'',
		'```json',
		JSON.stringify(
			{
				kind: 'loop or once',
				target: { selector: 'string', text: 'optional, matched case-insensitively' },
				steps: [
					{ step: 'click', target: { selector: 'string' }, pointerSequence: 'optional boolean' },
					{ step: 'waitFor', target: { selector: 'string' }, maxWaitMs: 5000 },
					{ step: 'waitGone', target: { selector: 'string' }, maxWaitMs: 5000 },
					{ step: 'scrollUntil', target: { selector: 'string' }, maxWaitMs: 5000 },
					{ step: 'wait', ms: 500 },
					{ step: 'navigate', url: 'https://www.youtube.com/feed/channels' }
				]
			},
			null,
			2
		),
		'```',
		'',
		'A plan is one of two shapes, and `kind` says which.',
		'',
		'`kind: "loop"` empties a list. `target` says what one still-present item looks like and',
		'`steps` say what makes that one item go away. Do not write the loop itself: the app',
		'repeats the steps, counts what went, waits between rounds and stops when the target',
		'finds nothing.',
		'',
		'`kind: "once"` does the steps a single time and needs no `target`. That is the shape for',
		'anything that is not a deletion — opening a page, dismissing a cookie banner, expanding',
		'a section. Use `navigate` to open a page; only addresses on the platform itself are',
		'allowed, and anything else is refused.',
		'',
		'Ten steps at most, either way.',
		'',
		'Name elements by selector, and where a selector is not enough by the word the element',
		'carries. Never by position, index or nth-child: the plan is saved and run again later,',
		'and by then the page has rendered differently. `pointerSequence: true` is for a control',
		'that only reacts to a full mouse sequence — YouTube’s menu entries are the known case.',
		'',
		'This is what the engine already looks for, as a guide to how these pages are built:',
		'',
		'```json',
		JSON.stringify(siteConfig, null, 2),
		'```',
		'',
		'A whole good answer for emptying a list:',
		JSON.stringify(
			{
				kind: 'loop',
				target: { selector: '[data-testid="unlike"]' },
				steps: [
					{ step: 'click', target: { selector: '[data-testid="unlike"]' } },
					{ step: 'waitGone', target: { selector: '[data-testid="unlike"]' }, maxWaitMs: 5000 }
				]
			},
			null,
			2
		),
		'',
		'And one for opening a page, which is kept as an entry in the app’s own navigation:',
		JSON.stringify(
			{
				kind: 'once',
				steps: [{ step: 'navigate', url: 'https://www.youtube.com/feed/channels' }]
			},
			null,
			2
		)
	].join('\n');
}

/**
 * Reads the model's answer as a plan, or says why it is not one.
 *
 * Tolerant about the wrapping and strict about the content: a fence or a sentence of preamble
 * is the ordinary way a model answers and is not worth refusing over, but what is inside has
 * to satisfy `ActionPlanSchema` exactly. That check is the whole reason a plan can be run at
 * all, so nothing here may fall back to "close enough".
 */
export function parseActionPlan(answer: string): { plan: ActionPlan } | { error: string } {
	const fenced = answer.match(/```(?:json)?\s*([\s\S]*?)```/);
	const body = (fenced?.[1] ?? answer).trim();
	// A model that explained itself first still put the object in there somewhere.
	const start = body.indexOf('{');
	const end = body.lastIndexOf('}');
	if (start === -1 || end <= start) return { error: 'the answer carries no JSON object' };

	let value: unknown;
	try {
		value = JSON.parse(body.slice(start, end + 1));
	} catch (cause) {
		return { error: cause instanceof Error ? cause.message : String(cause) };
	}

	const result = ActionPlanSchema.safeParse(value);
	if (!result.success) {
		const first = result.error.issues[0];
		const where = first?.path.join('.');
		return { error: where ? `${where}: ${first?.message}` : (first?.message ?? 'not a plan') };
	}
	return { plan: result.data };
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

/**
 * The page the plan is for, as the page itself described it.
 *
 * Redacted in the site webview before it ever crosses the bridge — see
 * `$lib/engine/structure.ts` for what survives and what does not. This is the only part of a
 * request that comes off a platform page, and it is why the preview matters more than it did.
 */
function describeStructure(structure: string): string {
	return [
		'## The page, as it is right now',
		'',
		'A skeleton of what is on screen. Every text node that is not the label of a control has',
		'been removed, along with every address and anything naming a person — so an element you',
		'can see here with no words in it may well carry a post, and you are not being shown it.',
		'',
		'Write your selectors against what is here.',
		'',
		'```html',
		structure,
		'```'
	].join('\n');
}

/**
 * How the engine already empties a list, in its own source.
 *
 * The plan vocabulary is small enough to explain in a paragraph, but the shape of a *good*
 * plan — open the menu, wait for it, click the entry by its wording, wait for it to go — is
 * easier to copy than to describe. `?raw` keeps these in step with the modules themselves
 * rather than with a paraphrase of them that would rot.
 */
function describeEngineSource(platform: Platform | undefined): string {
	if (!platform) return '';
	const source = platform === 'x' ? xLikesSource : youtubeLikesSource;
	return [
		'## How the built-in actions do it',
		'',
		`The engine module that empties likes on ${platform === 'x' ? 'X' : 'YouTube'}. You are`,
		'not writing this — your plan is data, not code — but the order of the steps and what it',
		'waits for between them is exactly what a good plan copies.',
		'',
		'```ts',
		source.trim(),
		'```'
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
		| 'assistant.preview.engine'
		| 'assistant.preview.structure'
		| 'assistant.preview.report';
	body: string;
}

/** Everything a request is built from besides the log and the question. */
export interface PromptContext {
	language: string;
	mode?: PromptMode;
	appVersion?: string;
	/** The platform whose page a plan would act on, when one is open. */
	platform?: Platform;
	/** The redacted page skeleton, when it could be read. Absent is normal, not an error. */
	structure?: string;
}

/** The fixed parts, in the order they are sent. The log and the question follow them. */
export function promptSections(context: PromptContext): PromptSection[] {
	const { language, mode = 'question', appVersion = '', platform, structure } = context;
	const engine = mode === 'patch' ? describeEngineSource(platform) : '';
	return [
		{ titleKey: 'assistant.preview.role', body: describeRole(language, mode) },
		{ titleKey: 'assistant.preview.app', body: describeApp() },
		{ titleKey: 'assistant.preview.fixes', body: describeTroubleshooting() },
		{ titleKey: 'assistant.preview.source', body: describeSource() },
		...(mode === 'patch'
			? [{ titleKey: 'assistant.preview.patch' as const, body: describePatchTask() }]
			: []),
		...(engine ? [{ titleKey: 'assistant.preview.engine' as const, body: engine }] : []),
		// Last of the fixed parts and closest to the question: it is what the answer is about,
		// and it is the one part the user is being asked to vouch for before sending.
		...(mode === 'patch' && structure
			? [{ titleKey: 'assistant.preview.structure' as const, body: describeStructure(structure) }]
			: []),
		...(mode === 'report'
			? [{ titleKey: 'assistant.preview.report' as const, body: describeReportTask(appVersion) }]
			: [])
	];
}

export function buildPrompt(question: string, entries: LogEntry[], context: PromptContext): string {
	return [
		...promptSections(context).map((section) => section.body),
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
