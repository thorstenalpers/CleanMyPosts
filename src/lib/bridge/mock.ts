import type { BridgeMethodName, BridgeParams, BridgeResult, PushEvent } from './contract';
import type { WebView2Host, WebView2MessageEvent } from './webview2.d.ts';
import { createBridgeClient, type BridgeClient } from './client';

export type MockHandler<M extends BridgeMethodName> = (
	params: BridgeParams<M>
) => BridgeResult<M> | Promise<BridgeResult<M>>;

export type MockHandlers = { [M in BridgeMethodName]?: MockHandler<M> };

/**
 * In-memory stand-in for `window.chrome.webview`, used by component tests
 * (`@testing-library/svelte`) and by `vite dev` in a plain browser, where
 * no real WebView2 host is available.
 */
export function createMockHost(handlers: MockHandlers) {
	const listeners = new Set<(event: WebView2MessageEvent) => void>();

	const host: WebView2Host = {
		postMessage(message: unknown) {
			const request = message as { id: string; method: BridgeMethodName; params: unknown };
			const handler = handlers[request.method];

			const reply = (data: unknown) => {
				const event = { data } as WebView2MessageEvent;
				for (const listener of listeners) listener(event);
			};

			if (!handler) {
				reply({
					id: request.id,
					ok: false,
					error: { message: `No mock handler for "${request.method}"` }
				});
				return;
			}

			Promise.resolve(handler(request.params as never))
				.then((result) => reply({ id: request.id, ok: true, result }))
				.catch((error: unknown) =>
					reply({
						id: request.id,
						ok: false,
						error: { message: error instanceof Error ? error.message : String(error) }
					})
				);
		},
		addEventListener(_type, listener) {
			listeners.add(listener);
		},
		removeEventListener(_type, listener) {
			listeners.delete(listener);
		}
	};

	function emit(event: PushEvent): void {
		const messageEvent = { data: event } as WebView2MessageEvent;
		for (const listener of listeners) listener(messageEvent);
	}

	const client: BridgeClient = createBridgeClient(host);
	return { client, emit };
}

/** Default handlers covering every method with harmless fake data — a safe base for `vite dev`. */
export function defaultMockHandlers(): MockHandlers {
	return {
		'app.getInfo': () => ({
			version: '0.0.0-dev',
			homepageUrl: 'https://github.com/thorstenalpers/CleanMyPosts',
			reportBugUrl: 'https://github.com/thorstenalpers/CleanMyPosts/issues'
		}),
		'settings.get': () => ({
			theme: 'Default',
			showLogs: true,
			confirmDeletion: true,
			accentColor: '#3B82F6',
			useSystemAccent: false,
			timeouts: {
				waitAfterDelete: 500,
				waitBetweenRetryDeleteAttempts: 500,
				waitAfterDocumentLoad: 3000
			}
		}),
		'settings.set': () => undefined,
		'site.navigate': () => ({ ok: true }),
		'site.runAction': () => ({ deletedCount: 0 }),
		'site.cancelAction': () => undefined,
		'site.hide': () => undefined,
		'site.reload': () => undefined,
		'layout.setSidebarExpanded': () => undefined,
		'updater.checkForUpdates': () => ({ updateAvailable: false }),
		'system.openUrl': () => undefined,
		'system.openLicense': () => undefined,
		'log.getBuffer': () => []
	};
}
