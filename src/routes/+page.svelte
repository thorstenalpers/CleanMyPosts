<script lang="ts">
	import { getAppContext } from '$lib/app-context';
	import OverviewView from '$lib/views/overview-view.svelte';

	const { settingsStore, loginStore, logStore, runner, updater, openPlatform, runPlanOn } =
		getAppContext();
</script>

<OverviewView
	{settingsStore}
	{loginStore}
	{logStore}
	{runner}
	{updater}
	{runPlanOn}
	onOpen={openPlatform}
	onDismissIntro={() => settingsStore.update({ ...settingsStore.settings, showIntro: false })}
/>
