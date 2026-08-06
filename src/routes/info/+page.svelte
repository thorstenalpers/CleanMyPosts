<script lang="ts">
	import { getAppContext } from '$lib/app-context';
	import InfoView from '$lib/views/info-view.svelte';

	const { bridge, settingsStore } = getAppContext();
</script>

<InfoView {bridge} {settingsStore} />
