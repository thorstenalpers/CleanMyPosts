import { getContext, setContext } from 'svelte';
import type { BridgeClient } from '$lib/bridge/client';
import type { Platform } from '$lib/bridge/contract';
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
