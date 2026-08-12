/**
 * Wire protocol inside the extension: popup <-> background <-> content script.
 *
 * Distinct from `$lib/engine/protocol.ts`, which the content script speaks to report a run.
 * Those messages arrive here untouched and are relayed on; this file governs everything else.
 */

import type { ContentMessage, Platform, XAction, YouTubeAction } from '$lib/engine/protocol';

export type Action = XAction | YouTubeAction;

export interface RunState {
	status: 'idle' | 'preparing' | 'running' | 'done' | 'error';
	platform?: Platform;
	action?: Action;
	tabId?: number;
	deletedCount: number;
	message?: string;
}

export const IDLE: RunState = { status: 'idle', deletedCount: 0 };

/** Popup -> background. */
export type PopupMessage =
	{ kind: 'start'; platform: Platform; action: Action } | { kind: 'stop' } | { kind: 'getState' };

/** Background -> content script. Answers come back as `ContentMessage`. */
export type HostMessage =
	| {
			kind: 'run';
			platform: Platform;
			action: Action;
			params: {
				requestId: string;
				waitAfterDelete: number;
				waitBetweenRetryDeleteAttempts: number;
				userName?: string;
			};
	  }
	| { kind: 'probe'; requestId: string; what: 'userName' | 'loginStatus' };

/** Background -> popup. Broadcast, so it arrives whether or not the popup is open. */
export type BackgroundMessage =
	| { kind: 'state'; state: RunState }
	| { kind: 'log'; level: 'debug' | 'info' | 'warning' | 'error'; message: string };

/** A content script report, tagged so the background can tell it from a popup message. */
export interface ContentReport {
	kind: 'content';
	message: ContentMessage;
}

/**
 * The waits the standalone scripts default to. Deletion is deliberately slow — these are the
 * only brake against the platform treating the session as automation.
 */
export const DEFAULT_WAITS = {
	waitAfterDelete: 500,
	waitBetweenRetryDeleteAttempts: 500
} as const;
