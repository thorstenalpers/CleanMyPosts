import { getContext, setContext } from 'svelte';
import type { BridgeClient } from '$lib/bridge/client';
import type { ActionPlan, ActionResult, Platform } from '$lib/bridge/contract';
import type { SettingsStore } from '$lib/stores/settings.svelte';
import type { LogStore } from '$lib/stores/log.svelte';
import type { SiteLoginStore } from '$lib/stores/site-login.svelte';
import type { ActionRunner } from '$lib/stores/action-runner.svelte';
import type { UpdaterStore } from '$lib/stores/updater.svelte';

export interface AppContext {
	bridge: BridgeClient;
	settingsStore: SettingsStore;
	logStore: LogStore;
	loginStore: SiteLoginStore;
	runner: ActionRunner;
	updater: UpdaterStore;
	/** Routing plus the site calls that go with it — the layout owns both, pages borrow them. */
	openPlatform: (platform: Platform, options?: { deleteAll?: boolean }) => void;
	/**
	 * Brings a platform on screen and then runs a plan on it.
	 *
	 * One place, because the waiting is the part that is easy to leave out. A plan run from
	 * the assistant used to act on a webview the layout had parked off screen — it clicked,
	 * it reported, and the user saw nothing at all and reasonably concluded it had not run.
	 * The layout owns both the route and the hand-off timer, so it owns this too.
	 */
	runPlanOn: (action: {
		platform: Platform;
		plan: ActionPlan;
		/** Named in the log, so a run can be told from the built-in ones months later. */
		label?: string;
	}) => Promise<ActionResult>;
}

const KEY = Symbol('cmp-app');

export function setAppContext(context: AppContext): AppContext {
	return setContext(KEY, context);
}

export function getAppContext(): AppContext {
	const context = getContext<AppContext | undefined>(KEY);
	if (!context) {
		throw new Error('getAppContext called outside the app layout.');
	}
	return context;
}
