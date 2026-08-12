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
	 * How many times the current action has been re-run on a freshly loaded page.
	 *
	 * Both platforms leave items on screen that they have already removed — the row goes on the
	 * next page load and not before — so a round that deleted something is not evidence the
	 * list is empty. Only a round that deletes nothing is. Capped, because "it deleted one" is
	 * also what an engine looping on the same item would report.
	 */
	rounds: number;
	/**
	 * The handle, read off the page once and kept for the rest of the queue.
	 *
	 * In `storage.session`, which is memory and gone when the browser closes — the alternative
	 * is navigating back to x.com/home before every one of the five actions to read it again.
	 */
	userName?: string;
	/**
	 * The platform that turned out not to be signed in.
	 *
	 * Kept so the popup can grey out what cannot work rather than let it be pressed again for
	 * the same message. Cleared by opening one of that platform's pages, which is what somebody
	 * does about it.
	 */
	signedOut?: Platform;
	message?: string;
}

export const IDLE: RunState = {
	status: 'idle',
	deletedCount: 0,
	totalCount: 0,
	queue: [],
	rounds: 0
};

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

/**
 * The waits, in milliseconds.
 *
 * The same three the desktop app exposes, deliberately — they are the only brake against a
 * platform treating the session as automation, and a user who had to raise them there should
 * not have to work out a second set of names here. `TimeoutSettings` in
 * `$lib/bridge/contract.ts` is the app's copy; importing it would drag the bridge in.
 */
export interface Timeouts {
	/** Between one deletion and the next. */
	waitAfterDelete: number;
	/** Between two attempts at the same item. */
	waitBetweenRetryDeleteAttempts: number;
	/** After a page has loaded, before the engine is asked to do anything on it. */
	waitAfterDocumentLoad: number;
}

/**
 * The popup's own preferences. In `storage.local`, so they survive the browser closing —
 * unlike everything else here, which is about one run and is meant to go.
 */
export interface PopupSettings {
	shown: Record<Platform, boolean>;
	timeouts: Timeouts;
	/** Set once the welcome box has been dismissed. */
	welcomed: boolean;
	/** `Default` follows the browser, which is what it did before there was a choice. */
	theme: 'Default' | 'Light' | 'Dark';
	/** A `Language` from `$lib/i18n`; `System` reads `navigator.language`. */
	language: string;
}

export const SETTINGS_KEY = 'popupSettings';

/** The app's own defaults, so a run behaves the same in either place until it is changed. */
export const DEFAULT_SETTINGS: PopupSettings = {
	shown: { x: true, youtube: true },
	timeouts: {
		waitAfterDelete: 500,
		waitBetweenRetryDeleteAttempts: 500,
		waitAfterDocumentLoad: 1000
	},
	welcomed: false,
	theme: 'Default',
	language: 'System'
};

/** Popup -> background. One action or all of them is the same request with a longer list. */
export type PopupMessage =
	| { kind: 'start'; platform: Platform; actions: Action[] }
	/** Opens the page a list lives on and touches nothing — what a row click does. */
	| { kind: 'show'; platform: Platform; action: Action }
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
