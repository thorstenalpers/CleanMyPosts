/**
 * What a question is asked against.
 *
 * Two parts, both of which the app can vouch for. The description is written here rather
 * than fetched, so the model is told what the app does instead of guessing from the log.
 * The log is the only runtime data that goes out, and it is the one thing this app already
 * guarantees is free of post content, handles, cookies and tokens — see
 * `.agents/docs/12-testing-and-quality.md`.
 */
import type { LogEntry } from '$lib/bridge/contract';
import { X_GROUPS, YOUTUBE_GROUPS } from '$lib/actions';

/** The last stretch of the log; older lines rarely explain the run being asked about. */
const LOG_LINES = 200;

function describeApp(): string {
	const x = X_GROUPS.map((group) => group.key).join(', ');
	const youtube = YOUTUBE_GROUPS.map((group) => group.key).join(', ');
	return [
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

function describeLog(entries: LogEntry[]): string {
	if (entries.length === 0) return 'The log is empty — nothing has run yet in this session.';

	const recent = entries.slice(-LOG_LINES);
	const skipped = entries.length - recent.length;
	const lines = recent.map((entry) => `${entry.timestamp} ${entry.level}: ${entry.message}`);
	return [
		skipped > 0
			? `The last ${recent.length} log lines (${skipped} older ones omitted):`
			: 'The log:',
		...lines
	].join('\n');
}

export function buildPrompt(question: string, entries: LogEntry[], language: string): string {
	return [
		describeApp(),
		'',
		describeLog(entries),
		'',
		`Question: ${question.trim()}`,
		'',
		`Answer briefly, using only what is above. Write the answer in ${language}.`
	].join('\n');
}
