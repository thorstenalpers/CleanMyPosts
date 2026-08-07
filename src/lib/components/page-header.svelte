<script lang="ts">
	import type { Component } from 'svelte';
	import { t } from '$lib/i18n/index.svelte';
	import LanguageMenu from '$lib/components/language-menu.svelte';
	import ModeToggle from '$lib/components/mode-toggle.svelte';
	import type { SettingsStore } from '$lib/stores/settings.svelte';

	interface Props {
		title: string;
		icon?: Component;
		/**
		 * Where the user is. A route for the app's own pages, the real address for a platform:
		 * the window has no address bar, and on X and YouTube that is the one thing a person
		 * needs to check before trusting a page with their account.
		 */
		location: string;
		/** For a page whose mark already is its name: the word would only say it twice. */
		iconOnly?: boolean;
		settingsStore: SettingsStore;
		/** Passed along: a menu in this bar opens over the platform webview, not under it. */
		onMenuOpenChange?: (open: boolean) => void;
	}

	let {
		title,
		icon,
		location,
		iconOnly = false,
		settingsStore,
		onMenuOpenChange
	}: Props = $props();
</script>

<header class="flex h-11 shrink-0 items-center gap-2 border-b bg-background px-3">
	{#if icon}
		{@const Icon = icon}
		<Icon class="size-4 shrink-0 {iconOnly ? 'text-foreground' : 'text-muted-foreground'}" />
	{/if}
	<!-- Still announced when it is not drawn: the mark carries the name for the eye only. -->
	<span class={iconOnly ? 'sr-only' : 'shrink-0 text-[13px] font-semibold tracking-tight'}>
		{title}
	</span>

	<span
		title={location}
		aria-label={t('header.url')}
		class="min-w-0 flex-1 truncate rounded-md bg-muted/60 px-2 py-1 font-mono text-[11px] text-muted-foreground"
	>
		{location}
	</span>

	<div class="flex shrink-0 items-center gap-0.5">
		<LanguageMenu {settingsStore} onOpenChange={onMenuOpenChange} />
		<ModeToggle {settingsStore} />
	</div>
</header>
