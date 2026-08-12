/**
 * The channel between the extension's two content scripts.
 *
 * The engine runs in the page's own world so that `window.__cmp` is the same object the
 * desktop app exposes — reachable from the console, patchable per `config.ts`, and running
 * against the page exactly as the app's copy does. That world has no `chrome.*`, so a second
 * script in the isolated world does the talking and these events join the two.
 *
 * Payloads are JSON strings, not objects: `detail` is structured-cloned across the world
 * boundary, and a string is the one shape that survives it unexamined.
 */

export const COMMAND_EVENT = '__cmp:command';
export const ANSWER_EVENT = '__cmp:answer';
export const REPORT_EVENT = '__cmp:report';

/** How long the isolated side waits before calling the page world absent. */
export const ANSWER_TIMEOUT_MS = 2000;

export interface PageCommand {
	id: string;
	/** A `HostMessage`, carried as-is. */
	message: unknown;
}

export interface PageAnswer {
	id: string;
	value?: unknown;
	error?: string;
}

export function send(type: string, payload: unknown): void {
	document.dispatchEvent(new CustomEvent(type, { detail: JSON.stringify(payload) }));
}

export function receive<T>(type: string, handler: (payload: T) => void): void {
	document.addEventListener(type, (event) => {
		const detail = (event as CustomEvent<string>).detail;
		if (typeof detail === 'string') handler(JSON.parse(detail) as T);
	});
}
