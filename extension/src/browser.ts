/**
 * The slice of the extension API this code uses, reached through an import rather than the
 * global `chrome`.
 *
 * A global declaration — `@types/chrome` or a hand-written one — lands on `typeof globalThis`,
 * and from there TypeScript intersects it into `window.chrome`, which
 * `src/lib/bridge/webview2.d.ts` already owns as WebView2's one-property object. That breaks
 * the engine and a dozen of its tests over a name this side never needed to be global.
 *
 * Firefox aliases `chrome` onto its own `browser` namespace, so one binding covers both.
 */

export interface Tab {
	id?: number;
	url?: string;
}

export interface TabChangeInfo {
	status?: string;
	url?: string;
}

type MessageListener<M> = (
	message: M,
	sender: unknown,
	sendResponse: (response?: unknown) => void
) => boolean | void;

type TabListener = (tabId: number, changeInfo: TabChangeInfo) => void;

interface Area {
	get(keys: string | string[]): Promise<Record<string, unknown>>;
	set(items: Record<string, unknown>): Promise<void>;
}

interface BrowserApi {
	runtime: {
		sendMessage<R = unknown>(message: unknown): Promise<R>;
		onMessage: { addListener<M = unknown>(callback: MessageListener<M>): void };
	};
	tabs: {
		get(tabId: number): Promise<Tab>;
		query(query: { active?: boolean; currentWindow?: boolean }): Promise<Tab[]>;
		create(properties: { url?: string; active?: boolean }): Promise<Tab>;
		update(tabId: number, properties: { url?: string }): Promise<Tab | undefined>;
		reload(tabId: number): Promise<void>;
		sendMessage<R = unknown>(tabId: number, message: unknown): Promise<R>;
		onUpdated: {
			addListener(callback: TabListener): void;
			removeListener(callback: TabListener): void;
		};
	};
	storage: {
		/** Cleared when the browser closes, and out of reach of content scripts. */
		session: Area;
		/** Survives the browser closing. Only the popup's own preferences live here. */
		local: Area;
	};
}

export const browser = (globalThis as unknown as { chrome: BrowserApi }).chrome;
