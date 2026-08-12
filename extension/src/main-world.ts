/**
 * The engine, in the page's own world.
 *
 * Not the isolated world a content script normally gets. Two reasons, and the second is the
 * one that matters: `window.__cmp` has to be the object the console can reach, because
 * patching `__cmp.config` is how a selector this app has never seen gets fixed without a
 * release — that is what `config.ts` exists for, and an isolated `__cmp` is reachable by
 * nobody. And running here means running where the desktop app's copy runs, so a page that
 * behaves for the app behaves here.
 *
 * The cost is that the page can reach `__cmp` too. The desktop app has always paid it; the
 * alternative is an engine nobody can diagnose on the one surface where it breaks.
 *
 * Nothing in this file may touch `chrome.*` — there is none here. `content.ts` is the half
 * that can, and the two speak through `page-protocol.ts`.
 */

import '$lib/engine/content-entry';
import { setTransport } from '$lib/engine/dom';
import type { ContentMessage } from '$lib/engine/protocol';
import { ANSWER_EVENT, COMMAND_EVENT, receive, REPORT_EVENT, send } from './page-protocol';
import type { PageAnswer, PageCommand } from './page-protocol';
import type { HostMessage } from './protocol';

setTransport((message: ContentMessage) => send(REPORT_EVENT, message));

receive<PageCommand>(COMMAND_EVENT, ({ id, message }) => {
	const command = message as HostMessage;
	const api = window.__cmp;

	if (!api) {
		send(ANSWER_EVENT, { id, error: 'engine not loaded' } satisfies PageAnswer);
		return;
	}

	if (command.kind === 'run') {
		api.run(command.platform, command.action, JSON.stringify(command.params));
		send(ANSWER_EVENT, { id, value: { started: true } } satisfies PageAnswer);
		return;
	}

	const value = command.what === 'userName' ? api.getUserName() : api.getLoginStatus();
	send(ANSWER_EVENT, { id, value: { value } } satisfies PageAnswer);
});
