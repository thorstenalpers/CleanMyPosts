import type { WebView2Host, WebView2MessageEvent } from './webview2.d.ts';

interface TauriGlobal {
	core: { invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown> };
	event: {
		listen: (event: string, handler: (event: { payload: unknown }) => void) => Promise<() => void>;
	};
}

declare global {
	interface Window {
		__TAURI__?: TauriGlobal;
	}
}

export function isTauri(): boolean {
	return typeof window !== 'undefined' && window.__TAURI__ !== undefined;
}

/**
 * Adapts Tauri's `invoke` + event channel to the same shape `BridgeClient` already speaks,
 * so the client, the Zod contract, the stores and their tests stay unaware of the host swap.
 *
 * Tauri resolves each `invoke` on its own promise, so the id correlation `BridgeClient` does
 * is redundant here — but replying with the same `{ id, ok, result }` envelope is cheaper
 * than teaching the client a second calling convention.
 */
export function createTauriHost(): WebView2Host {
	const listeners = new Set<(event: WebView2MessageEvent) => void>();
	const tauri = window.__TAURI__;

	if (!tauri) {
		throw new Error('createTauriHost called outside a Tauri window.');
	}

	const deliver = (data: unknown) => {
		const event = { data } as WebView2MessageEvent;
		for (const listener of listeners) listener(event);
	};

	void tauri.event.listen('cmp-push', (event) => deliver(event.payload));

	return {
		postMessage(message: unknown) {
			const request = message as { id: string; method: string; params: unknown };
			tauri.core
				.invoke('bridge_call', { method: request.method, params: request.params ?? null })
				.then((result) => deliver({ id: request.id, ok: true, result: result ?? undefined }))
				.catch((error: unknown) =>
					deliver({
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
}
