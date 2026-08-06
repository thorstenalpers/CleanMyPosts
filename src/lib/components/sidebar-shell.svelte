<script lang="ts" module>
	export interface NavItem<TKey extends string> {
		key: TKey;
		/** Already translated by the caller: brand names are not message keys. */
		label: string;
		icon: Component;
		/** Extra classes for the icon only — where a platform's own mark carries its colour. */
		iconClass?: string;
		/** Rendered as a dot next to the label — connection state, not a count. */
		status?: 'connected' | 'disconnected';
		/** Pins the item to the bottom of the sidebar instead of the top group. */
		footer?: boolean;
	}
</script>

<script lang="ts" generics="TKey extends string">
	import type { Component } from 'svelte';
	import { cn } from '$lib/utils';
	import { t } from '$lib/i18n/index.svelte';
	import PanelLeftIcon from '@lucide/svelte/icons/panel-left';

	interface Props<TKey extends string> {
		navItems: NavItem<TKey>[];
		activeKey: TKey;
		/** The button is passed along so a caller can anchor something to it — a native menu has to be told where to pop up. */
		onNavigate: (key: TKey, button: HTMLButtonElement) => void;
		expanded?: boolean;
	}

	let { navItems, activeKey, onNavigate, expanded = $bindable(true) }: Props<TKey> = $props();

	const topItems = $derived(navItems.filter((item) => !item.footer));
	const footerItems = $derived(navItems.filter((item) => item.footer));
</script>

{#snippet navButton(item: NavItem<TKey>)}
	{@const active = activeKey === item.key}
	<button
		type="button"
		aria-current={active ? 'page' : undefined}
		title={expanded ? undefined : item.label}
		onclick={(event: MouseEvent & { currentTarget: HTMLButtonElement }) =>
			onNavigate(item.key, event.currentTarget)}
		class={cn(
			'group relative flex h-9 w-full cursor-pointer items-center gap-2.5 overflow-hidden rounded-md text-sm',
			// Colour only. The row used to lean towards its page and grow its icon on hover, and
			// text being rasterised mid-transform is what read as a blur — Windows itself moves
			// nothing here either, it just fills the row.
			'transition-colors duration-150',
			'focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none',
			expanded ? 'px-2.5' : 'justify-center px-0',
			'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
			active
				? 'bg-sidebar-primary/15 font-semibold text-sidebar-primary hover:bg-sidebar-primary/20'
				: 'text-sidebar-foreground'
		)}
	>
		<!-- Slides in rather than appearing, which is the difference between a state and a
		     flicker. aria-current carries the same meaning for AT. -->
		<span
			aria-hidden="true"
			class={cn(
				'absolute start-0 top-1.5 bottom-1.5 w-[3px] rounded-e-full bg-sidebar-primary transition-transform duration-200',
				active ? 'translate-x-0' : '-translate-x-1.5 rtl:translate-x-1.5'
			)}
		></span>
		<item.icon class={cn('size-4 shrink-0', item.iconClass)} />
		{#if expanded}
			<span class="flex-1 truncate text-start">{item.label}</span>
			{#if item.status}
				<span
					aria-hidden="true"
					class={cn(
						'size-1.5 shrink-0 rounded-full',
						item.status === 'connected' ? 'bg-current' : 'bg-current opacity-30'
					)}
				></span>
				<span class="sr-only">
					{item.status === 'connected' ? t('site.signedIn') : t('site.signedOut')}
				</span>
			{/if}
		{/if}
	</button>
{/snippet}

<aside
	class={cn(
		'flex h-full flex-col overflow-hidden border-e border-sidebar-border bg-sidebar text-sidebar-foreground',
		'transition-[width] duration-150',
		expanded ? 'w-60' : 'w-14'
	)}
>
	<!-- Folded down to the rail the toggle is the only thing left up here, which is where
	     the way out belongs. -->
	<div class={cn('flex h-12 shrink-0 items-center gap-1 px-2', !expanded && 'justify-center')}>
		<button
			type="button"
			onclick={() => (expanded = !expanded)}
			aria-label={expanded ? t('nav.collapse') : t('nav.expand')}
			aria-expanded={expanded}
			class="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-sidebar-foreground/70 transition-colors duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none"
		>
			<PanelLeftIcon class="size-4" />
		</button>
		{#if expanded}
			<span class="flex min-w-0 flex-col leading-none">
				<span class="truncate text-[13px] font-semibold tracking-tight">CleanMyPosts</span>
				<span class="truncate pt-0.5 text-[10px] text-sidebar-foreground/60"
					>{t('app.tagline')}</span
				>
			</span>
		{/if}
	</div>

	<!-- The gap is what separates the name of the app from the way around it. -->
	<div class="min-h-0 flex-1 overflow-y-auto px-1.5 pt-2">
		<nav class="flex flex-col gap-0.5">
			{#each topItems as item (item.key)}
				{@render navButton(item)}
			{/each}
		</nav>
	</div>

	{#if footerItems.length > 0}
		<nav class="flex shrink-0 flex-col gap-0.5 border-t border-sidebar-border px-1.5 py-1.5">
			{#each footerItems as item (item.key)}
				{@render navButton(item)}
			{/each}
		</nav>
	{/if}
</aside>
