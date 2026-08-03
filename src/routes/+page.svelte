<script lang="ts">
	import { getAppContext } from '$lib/app-context';
	import OverviewView from '$lib/views/overview-view.svelte';

	const { settingsStore, loginStore, logStore, runner, openPlatform } = getAppContext();
</script>

<OverviewView
	{settingsStore}
	{loginStore}
	{logStore}
	{runner}
	onOpen={openPlatform}
	onDismissIntro={() => settingsStore.update({ ...settingsStore.settings, showIntro: false })}
/>
