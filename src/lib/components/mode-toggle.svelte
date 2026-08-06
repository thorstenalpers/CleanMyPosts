<script lang="ts">
	import { mode } from 'mode-watcher';
	import type { SettingsStore } from '$lib/stores/settings.svelte';
	import { t } from '$lib/i18n/index.svelte';
	import SunIcon from '@lucide/svelte/icons/sun';
	import MoonIcon from '@lucide/svelte/icons/moon';

	interface Props {
		settingsStore: SettingsStore;
	}

	let { settingsStore }: Props = $props();

	// `mode.current` is the resolved mode, so `Default` (follow Windows) still lands on the
	// icon that matches what is on screen.
	const isDark = $derived(mode.current === 'dark');
</script>

<button
	type="button"
	aria-label={isDark ? t('header.toLight') : t('header.toDark')}
	onclick={() =>
		settingsStore.update({ ...settingsStore.settings, theme: isDark ? 'Light' : 'Dark' })}
	class="flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
>
	{#if isDark}
		<SunIcon class="size-4" />
	{:else}
		<MoonIcon class="size-4" />
	{/if}
</button>
