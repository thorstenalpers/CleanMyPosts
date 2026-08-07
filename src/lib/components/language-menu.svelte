<script lang="ts">
	import type { Language } from '$lib/bridge/contract';
	import type { SettingsStore } from '$lib/stores/settings.svelte';
	import { LANGUAGES, t } from '$lib/i18n/index.svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import LanguagesIcon from '@lucide/svelte/icons/languages';
	import CheckIcon from '@lucide/svelte/icons/check';

	interface Props {
		settingsStore: SettingsStore;
		/**
		 * Told whenever the list opens or closes.
		 *
		 * The list is taller than the header strip, and while a platform is showing its webview
		 * is painted over everything below that strip — so the entries would open behind it.
		 * The layout answers this by giving the chrome the whole window for as long as it is up.
		 */
		onOpenChange?: (open: boolean) => void;
	}

	let { settingsStore, onOpenChange }: Props = $props();

	/** `System` is the only entry with a translated label; every language names itself. */
	const entries = $derived(
		LANGUAGES.map((language) => ({
			id: language.id,
			label: language.id === 'System' ? t('settings.language.system') : language.label
		}))
	);

	function select(language: Language): void {
		void settingsStore.update({ ...settingsStore.settings, language });
	}
</script>

<DropdownMenu.Root onOpenChange={(open: boolean) => onOpenChange?.(open)}>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<button
				{...props}
				type="button"
				aria-label={t('header.language')}
				class="flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
			>
				<LanguagesIcon class="size-4" />
			</button>
		{/snippet}
	</DropdownMenu.Trigger>

	<DropdownMenu.Content align="end" class="w-44">
		{#each entries as entry (entry.id)}
			<DropdownMenu.Item onSelect={() => select(entry.id)}>
				<span class="flex-1">{entry.label}</span>
				{#if settingsStore.settings.language === entry.id}
					<CheckIcon class="size-4" />
				{/if}
			</DropdownMenu.Item>
		{/each}
	</DropdownMenu.Content>
</DropdownMenu.Root>
