<script lang="ts">
	import type { BridgeClient } from '$lib/bridge/client';
	import type { SettingsStore } from '$lib/stores/settings.svelte';
	import type { SiteLoginStore } from '$lib/stores/site-login.svelte';
	import type { ActionRunner } from '$lib/stores/action-runner.svelte';
	import { X_GROUPS } from '$lib/actions';
	import PlatformPanel from './platform-panel.svelte';

	interface Props {
		bridge: BridgeClient;
		settingsStore: SettingsStore;
		loginStore: SiteLoginStore;
		runner: ActionRunner;
		open: boolean;
		startDeleteAll: boolean;
		onDeleteAllStarted: () => void;
		onClose: () => void;
	}

	let {
		bridge,
		settingsStore,
		loginStore,
		runner,
		open,
		startDeleteAll,
		onDeleteAllStarted,
		onClose
	}: Props = $props();
</script>

<PlatformPanel
	{bridge}
	{settingsStore}
	{runner}
	{open}
	{startDeleteAll}
	{onDeleteAllStarted}
	{onClose}
	platform="x"
	platformLabel="X"
	groups={X_GROUPS}
	loggedIn={!!loginStore.loggedIn.x}
/>
