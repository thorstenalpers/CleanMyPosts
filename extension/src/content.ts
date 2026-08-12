/**
 * The content script, and the only file that knows the engine runs inside an extension.
 *
 * Importing `content-entry` is what puts `window.__cmp` on this page — the same object the
 * desktop app injects into its site webview. Everything below it is transport: the engine
 * reports through `setTransport` instead of the WebView2 bridge, and the background worker
 * asks for runs through `runtime` instead of an `eval` against `window.__cmp`.
 *
 * `window` here is the isolated world the browser gives a content script, not the page's own,
 * so `__cmp` is never reachable from the site. Which origins this runs on is decided by
 * `manifest.json`, taking the place of the host-side origin guard the app has.
 */

import '$lib/engine/content-entry';
import { setTransport } from '$lib/engine/dom';
import type { ContentMessage } from '$lib/engine/protocol';
import { browser } from './browser';
import type { ContentReport, HostMessage } from './protocol';

/**
 * Everything also goes to this tab's console, `debug` and markup dumps included.
 *
 * The popup drops those — a 4,000-character dump of a menu that would not open is unreadable
 * in 340px — and they are exactly what a broken selector is diagnosed from. In a webview the
 * host held that detail; here the console is the only place with room for it, and setting a
 * transport at all is what had switched it off.
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

setTransport((message: ContentMessage) => {
	toConsole(message);
	// The worker may be asleep between two progress ticks; a rejected send is that and not a
	// reason to stop deleting, so it is swallowed rather than thrown into the run.
	const report: ContentReport = { kind: 'content', message };
	void browser.runtime.sendMessage(report).catch(() => {});
});

browser.runtime.onMessage.addListener((message: HostMessage, _sender, sendResponse) => {
	const api = window.__cmp;
	if (!api) {
		sendResponse({ error: 'engine not loaded' });
		return;
	}

	if (message.kind === 'run') {
		api.run(message.platform, message.action, JSON.stringify(message.params));
		sendResponse({ started: true });
		return;
	}

	sendResponse({
		value: message.what === 'userName' ? api.getUserName() : api.getLoginStatus()
	});
});
