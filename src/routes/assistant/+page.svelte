<script lang="ts">
	import { getAppContext } from '$lib/app-context';
	import AssistantView from '$lib/views/assistant-view.svelte';

	const { bridge, logStore, settingsStore, loginStore, runPlanOn } = getAppContext();
</script>

<AssistantView {bridge} {logStore} {settingsStore} {loginStore} {runPlanOn} />
