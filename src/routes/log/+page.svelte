<script lang="ts">
	import { getAppContext } from '$lib/app-context';
	import LogView from '$lib/views/log-view.svelte';

	const { logStore } = getAppContext();
</script>

<LogView {logStore} />
