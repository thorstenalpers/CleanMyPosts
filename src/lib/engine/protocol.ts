/**
 * Wire protocol between the host and the content-script running inside the
 * *site* webview (x.com / youtube.com). Distinct from `$lib/bridge/
 * contract.ts`, which governs the chrome-webview <-> host channel.
 *
 * `run`/`isEmpty` are invoked by the host via one-shot `eval` calls against
 * `window.__cmp`; `run` reports back asynchronously through
 * `chrome.webview.postMessage` instead of the host polling a `window`
 * variable — that round-trip-per-tick loop was the actual performance
 * problem in the previous implementation.
 */

import type { SiteConfig } from './config';

export type Platform = 'x' | 'youtube';

export type XAction =
	'deletePosts' | 'deleteReplies' | 'deleteReposts' | 'deleteLikes' | 'deleteFollowing';
export type YouTubeAction = 'deleteComments' | 'deleteLikes';

export interface RunParams {
	requestId: string;
	waitAfterDelete: number;
	waitBetweenRetryDeleteAttempts: number;
	userName?: string;
}

export interface ContentLogMessage {
	type: 'log';
	/** `debug` is dropped by the host unless the setting is on — see `settings.debugLogging`. */
	level: 'debug' | 'info' | 'warning' | 'error';
	message: string;
}

export interface ContentProgressMessage {
	type: 'progress';
	requestId: string;
	deletedCount: number;
	message?: string;
}

export interface ContentDoneMessage {
	type: 'done';
	requestId: string;
	deletedCount: number;
}

export interface ContentErrorMessage {
	type: 'error';
	requestId: string;
	message: string;
}

export type ContentMessage =
	ContentLogMessage | ContentProgressMessage | ContentDoneMessage | ContentErrorMessage;

export interface CmpApi {
	run(platform: Platform, action: XAction | YouTubeAction, paramsJson: string): void;
	isEmpty(platform: Platform, action: XAction | YouTubeAction): boolean;
	getUserName(): string;
	getLoginStatus(): string;
	/** Shows a result on the platform page — the only surface the app can reach while it shows. */
	toast(message: string, kind: 'success' | 'info' | 'error'): void;
	/**
	 * What the engine looks for, live and writable. The host evaluates the user's own patch
	 * against this before every run — see `$lib/engine/config.ts`.
	 */
	config: SiteConfig;
}

declare global {
	interface Window {
		__cmp?: CmpApi;
	}
}
