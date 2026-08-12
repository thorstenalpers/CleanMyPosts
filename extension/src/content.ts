/**
 * The isolated half: everything that needs `chrome.*`, and nothing that needs the page.
 *
 * The engine itself is in `main-world.ts`, running in the page's own world so the console can
 * reach `window.__cmp`. This script is the only thing between it and the extension — it
 * forwards the worker's commands into that world and carries the reports back out.
 */

import type { ContentMessage } from '$lib/engine/protocol';
import { browser } from './browser';
import {
	ANSWER_EVENT,
	ANSWER_TIMEOUT_MS,
	COMMAND_EVENT,
	receive,
	REPORT_EVENT,
	send
} from './page-protocol';
import type { PageAnswer, PageCommand } from './page-protocol';
import type { ContentReport } from './protocol';

/**
 * Also to this tab's console, `debug` and markup dumps included.
 *
 * The popup drops those — a 4,000-character dump of a menu that would not open is unreadable
 * in 340px — and they are exactly what a broken selector is diagnosed from.
 */
function toConsole(message: ContentMessage): void {
	const tag = '[CleanMyPosts]';
	if (message.type === 'log') {
		const write =
			message.level === 'error'
				? console.error
				: message.level === 'warning'
					? console.warn
					: console.log;
		write(`${tag} ${message.message}`);
	} else if (message.type === 'progress') {
		console.log(`${tag} ${message.deletedCount} removed`);
	} else if (message.type === 'error') {
		console.error(`${tag} ${message.message}`);
	}
}

receive<ContentMessage>(REPORT_EVENT, (message) => {
	toConsole(message);
	// The worker may be asleep between two progress ticks; a rejected send is that and not a
	// reason to stop deleting, so it is swallowed rather than thrown into the run.
	const report: ContentReport = { kind: 'content', message };
	void browser.runtime.sendMessage(report).catch(() => {});
});

const pending = new Map<string, (answer: PageAnswer) => void>();
let nextId = 0;

receive<PageAnswer>(ANSWER_EVENT, (answer) => {
	pending.get(answer.id)?.(answer);
	pending.delete(answer.id);
});

/**
 * Puts one command into the page world and waits for its answer.
 *
 * The timeout is the point: both scripts run at `document_idle` and their order is not
 * guaranteed, so a command can arrive before the engine is there. Failing after two seconds
 * hands the retry back to the worker, which already has one.
 */
function command(message: unknown): Promise<PageAnswer> {
	const id = String(nextId++);
	return new Promise((resolve) => {
		const timer = setTimeout(() => {
			pending.delete(id);
			resolve({ id, error: 'the page world did not answer' });
		}, ANSWER_TIMEOUT_MS);

		pending.set(id, (answer) => {
			clearTimeout(timer);
			resolve(answer);
		});

		send(COMMAND_EVENT, { id, message } satisfies PageCommand);
	});
}

browser.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
	void command(message).then((answer) =>
		sendResponse(answer.error ? { error: answer.error } : answer.value)
	);
	return true;
});
