<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { getAppContext } from '$lib/app-context';
	import AssistantView from '$lib/views/assistant-view.svelte';

	const { bridge, logStore } = getAppContext();
</script>

<AssistantView {bridge} {logStore} onOpenSettings={() => void goto(resolve('/settings'))} />
