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
	/** Of the action running now. */
	deletedCount: number;
	/** Across every action of this request, which is what "delete everything" reports. */
	totalCount: number;
	/**
	 * The actions still to come.
	 *
	 * A queue rather than a loop with `await`: MV3 stops the worker between two runs and takes
	 * any pending promise with it, so what comes next has to be readable from storage alone.
	 * `relay` starts the next one when a `done` arrives — which is also what wakes the worker.
	 */
	queue: Action[];
	/**
	 * The handle, read off the page once and kept for the rest of the queue.
	 *
	 * In `storage.session`, which is memory and gone when the browser closes — the alternative
	 * is navigating back to x.com/home before every one of the five actions to read it again.
	 */
	userName?: string;
	message?: string;
}

export const IDLE: RunState = { status: 'idle', deletedCount: 0, totalCount: 0, queue: [] };

/** Everything one platform can be emptied of, in the order it is done. */
export const ALL_ACTIONS: Record<Platform, Action[]> = {
	x: ['deletePosts', 'deleteReplies', 'deleteReposts', 'deleteLikes', 'deleteFollowing'],
	youtube: ['deleteComments', 'deleteLikes']
};

/**
 * What the popup needs to rebuild itself from nothing.
 *
 * Chrome closes a popup the moment focus leaves it, taking every local variable with it. So
 * neither the status nor the lines under it may live in the component — reopening has to look
 * like it was never shut, mid-run included.
 */
export interface Snapshot {
	state: RunState;
	lines: string[];
}

/** How many log lines are kept for a reopened popup. */
export const LOG_LIMIT = 100;

/** Popup -> background. One action or all of them is the same request with a longer list. */
export type PopupMessage =
	| { kind: 'start'; platform: Platform; actions: Action[] }
	| { kind: 'stop' }
	| { kind: 'getState' };

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
