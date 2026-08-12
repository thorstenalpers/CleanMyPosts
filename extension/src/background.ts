/**
 * What the Rust host does in the desktop app: pick the page, drive the tab to it, ask the
 * content script for a run, and relay what comes back.
 *
 * The retry loop is not here. It runs in the page, as it does in the app — which is also what
 * keeps this worker's own lifetime from mattering: MV3 may stop it mid-run, and the deleting
 * carries on regardless, because every progress report wakes it up again. Nothing about a run
 * is therefore held in a module variable; `storage.session` is the only state.
 */

import type { Platform } from '$lib/engine/protocol';
import { browser, type TabChangeInfo } from './browser';
import {
	DEFAULT_WAITS,
	IDLE,
	LOG_LIMIT,
	type Action,
	type BackgroundMessage,
	type ContentReport,
	type HostMessage,
	type PopupMessage,
	type RunState,
	type Snapshot
} from './protocol';

const STATE_KEY = 'runState';
const LOG_KEY = 'runLog';

/**
 * The same targets `src-tauri/src/commands/site.rs` builds, kept in step by hand — the host's
 * copy is Rust and cannot be imported. A page added there has to be added here too.
 */
function targetUrl(platform: Platform, action: Action, userName: string): string | undefined {
	const user = userName.replace(/[^A-Za-z0-9_]/g, '');
	if (platform === 'x') {
		switch (action) {
			case 'deletePosts':
				return `https://x.com/search?q=from%3A${user}&src=typed_query`;
			case 'deleteReplies':
				return `https://x.com/${user}/with_replies`;
			case 'deleteReposts':
				return `https://x.com/${user}`;
			case 'deleteLikes':
				return `https://x.com/${user}/likes`;
			case 'deleteFollowing':
				return `https://x.com/${user}/following`;
			default:
				return undefined;
		}
	}
	if (action === 'deleteComments')
		return 'https://myactivity.google.com/page?page=youtube_comments';
	if (action === 'deleteLikes') return 'https://www.youtube.com/playlist?list=LL';
	return undefined;
}

async function getState(): Promise<RunState> {
	const stored = await browser.storage.session.get(STATE_KEY);
	return (stored[STATE_KEY] as RunState | undefined) ?? IDLE;
}

async function setState(state: RunState): Promise<void> {
	await browser.storage.session.set({ [STATE_KEY]: state });
	notify({ kind: 'state', state });
}

async function getLines(): Promise<string[]> {
	const stored = await browser.storage.session.get(LOG_KEY);
	return (stored[LOG_KEY] as string[] | undefined) ?? [];
}

/** Kept here rather than in the popup, which does not survive losing focus. */
async function appendLine(line: string): Promise<void> {
	const lines = [...(await getLines()), line].slice(-LOG_LIMIT);
	await browser.storage.session.set({ [LOG_KEY]: lines });
}

/** The popup is usually shut, and a broadcast nobody listens to rejects. That is not an error. */
function notify(message: BackgroundMessage): void {
	void browser.runtime.sendMessage(message).catch(() => {});
}

function navigate(tabId: number, url: string): Promise<void> {
	return new Promise((resolve) => {
		function onUpdated(id: number, info: TabChangeInfo): void {
			if (id !== tabId || info.status !== 'complete') return;
			browser.tabs.onUpdated.removeListener(onUpdated);
			resolve();
		}
		browser.tabs.onUpdated.addListener(onUpdated);
		void browser.tabs.update(tabId, { url });
	});
}

/**
 * Asks the content script something, retrying while it is not there yet.
 *
 * `status: 'complete'` fires before a `document_idle` script is guaranteed to have registered
 * its listener, and on both platforms the page keeps building after load anyway.
 */
async function ask<T>(tabId: number, message: HostMessage, attempts = 20): Promise<T> {
	for (let i = 0; i < attempts; i++) {
		try {
			const answer = await browser.tabs.sendMessage<T & { error?: string }>(tabId, message);
			// The content script answers rather than rejects when the page world is not up yet, so
			// its error has to become one here or the retry below never runs.
			if (answer?.error) throw new Error(answer.error);
			return answer;
		} catch {
			await new Promise((resolve) => setTimeout(resolve, 500));
		}
	}
	throw new Error('the page never answered — reload it and try again');
}

const HOME: Record<Platform, string> = {
	x: 'https://x.com/home',
	youtube: 'https://www.youtube.com'
};

async function openTab(platform: Platform): Promise<number> {
	const [active] = await browser.tabs.query({ active: true, currentWindow: true });
	const tab = active?.id
		? active
		: await browser.tabs.create({ url: HOME[platform], active: true });
	if (!tab.id) throw new Error('no tab to work in');
	return tab.id;
}

/**
 * The handle, off the signed-in nav rail.
 *
 * It is in the page and in no store, which means X has to be open before a target url can be
 * built at all — hence the detour to the home page. Read once per queue rather than before
 * each action, which would be five more of them.
 */
async function readHandle(tabId: number): Promise<string> {
	await navigate(tabId, HOME.x);
	const answer = await ask<{ value?: string }>(tabId, {
		kind: 'probe',
		requestId: 'username',
		what: 'userName'
	});
	const userName = answer.value ?? '';
	if (!userName) throw new Error('not signed in to X');
	return userName;
}

/** Sets the queue up and starts it. One action or seven is the same path. */
async function start(platform: Platform, actions: Action[]): Promise<void> {
	// Read before the reset below wipes it. `||`, not `??`: a YouTube run stores the empty
	// string, and treating that as a known handle would build every X url without one.
	const known = (await getState()).userName;
	await browser.storage.session.set({ [LOG_KEY]: [] });
	await setState({ ...IDLE, status: 'preparing', platform, queue: actions });

	const tabId = await openTab(platform);
	const userName = platform === 'x' ? known || (await readHandle(tabId)) : '';

	await setState({ ...IDLE, status: 'preparing', platform, tabId, userName, queue: actions });
	await runNext();
}

/**
 * Takes the next action off the queue and runs it.
 *
 * Called by `start` once and by `relay` after every `done`. Reads its whole world back out of
 * storage, because between those two calls the worker may have been stopped and restarted.
 */
async function runNext(): Promise<void> {
	const state = await getState();
	const [action, ...rest] = state.queue;

	if (!action || !state.platform || !state.tabId) {
		await setState({ ...state, status: 'done', queue: [] });
		return;
	}

	const url = targetUrl(state.platform, action, state.userName ?? '');
	if (!url) throw new Error(`unknown action "${state.platform}:${action}"`);

	await navigate(state.tabId, url);
	await setState({ ...state, status: 'running', action, queue: rest, deletedCount: 0 });

	await ask(state.tabId, {
		kind: 'run',
		platform: state.platform,
		action,
		params: { requestId: action, ...DEFAULT_WAITS, userName: state.userName }
	});
}

/**
 * Opens the page a list lives on, and stops there.
 *
 * The whole of what a row click does. It leaves `action` set so the popup can mark the row
 * the tab is actually on, and `status` idle because nothing is running.
 */
async function show(platform: Platform, action: Action): Promise<void> {
	const known = (await getState()).userName;
	const tabId = await openTab(platform);
	const userName = platform === 'x' ? known || (await readHandle(tabId)) : '';

	const url = targetUrl(platform, action, userName);
	if (!url) throw new Error(`unknown action "${platform}:${action}"`);

	await navigate(tabId, url);
	await setState({ ...IDLE, platform, action, tabId, userName });
}

/**
 * A reload is the stop button.
 *
 * The loop lives in the page and the engine exposes no way to interrupt it, so taking the page
 * away is what ends it — the same thing closing the tab does for the standalone scripts.
 */
async function stop(): Promise<void> {
	const state = await getState();
	if (state.tabId) await browser.tabs.reload(state.tabId);
	await setState({ ...IDLE, message: 'stopped' });
}

async function relay(message: ContentReport['message']): Promise<void> {
	if (message.type === 'log') {
		notify({ kind: 'log', level: message.level, message: message.message });
		// `debug` carries the markup dumps, which belong in the tab console and would push
		// everything readable out of a 100-line buffer.
		if (message.level !== 'debug') await appendLine(message.message);
		return;
	}

	const state = await getState();
	if (message.type === 'progress') {
		await setState({ ...state, status: 'running', deletedCount: message.deletedCount });
		return;
	}

	if (message.type === 'done') {
		const totalCount = state.totalCount + message.deletedCount;
		const carryOn = state.queue.length > 0;
		// `deletedCount` belongs to the action that just ended and has been folded into the total,
		// so it goes back to zero — the popup shows the sum of the two and would count twice.
		await setState({
			...state,
			status: carryOn ? 'running' : 'done',
			deletedCount: 0,
			totalCount
		});
		// This message is also what woke the worker, if it had been stopped. Everything the next
		// action needs was read back from storage a line ago.
		if (carryOn) await runNext();
		return;
	}

	if (message.type === 'error') {
		// The queue goes with it: what state the page is in after a failed action is not knowable
		// from here, and navigating on regardless is how one broken selector empties a list nobody
		// asked about.
		await setState({ ...state, status: 'error', message: message.message, queue: [] });
	}
}

browser.runtime.onMessage.addListener(
	(message: PopupMessage | ContentReport, _sender, sendResponse) => {
		if (message.kind === 'content') {
			void relay(message.message);
			return;
		}

		if (message.kind === 'getState') {
			void Promise.all([getState(), getLines()]).then(([state, lines]) =>
				sendResponse({ state, lines } satisfies Snapshot)
			);
			return true;
		}

		if (message.kind === 'stop') {
			void stop().then(() => sendResponse({ ok: true }));
			return true;
		}

		if (message.kind === 'show') {
			void show(message.platform, message.action)
				.then(() => sendResponse({ ok: true }))
				.catch((error: unknown) => {
					const text = error instanceof Error ? error.message : String(error);
					void setState({ ...IDLE, status: 'error', message: text });
					sendResponse({ ok: false, error: text });
				});
			return true;
		}

		void start(message.platform, message.actions)
			.then(() => sendResponse({ ok: true }))
			.catch((error: unknown) => {
				const text = error instanceof Error ? error.message : String(error);
				void setState({ ...IDLE, status: 'error', message: text });
				sendResponse({ ok: false, error: text });
			});
		return true;
	}
);
