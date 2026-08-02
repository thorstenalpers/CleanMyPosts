<script lang="ts" module>
	export const SIDEBAR_EXPANDED_WIDTH = 240;
	export const SIDEBAR_COLLAPSED_WIDTH = 56;

	export interface NavItem<TKey extends string> {
		key: TKey;
		label: string;
		icon: Component;
		/** Rendered as a dot next to the label — connection state, not a count. */
		status?: 'connected' | 'disconnected';
		/** Pins the item to the bottom of the sidebar instead of the top group. */
		footer?: boolean;
	}
</script>

<script lang="ts" generics="TKey extends string">
	import type { Component, Snippet } from 'svelte';
	import { cn } from '$lib/utils';
	import PanelLeftIcon from '@lucide/svelte/icons/panel-left';

	interface Props<TKey extends string> {
		navItems: NavItem<TKey>[];
		activeKey: TKey;
		onNavigate: (key: TKey) => void;
		expanded?: boolean;
		/** Called with the resulting pixel width whenever expanded/collapsed — used by the injected overlay to push page content aside. Unused by the local app's own flex layout. */
		onWidthChange?: (widthPx: number) => void;
		/** Rendered indented directly under the active nav item when the sidebar is expanded. */
		subnav?: Snippet<[TKey]>;
		/** Pinned above the footer — the running-action bar goes here. */
		status?: Snippet;
		children?: Snippet;
	}

	let {
		navItems,
		activeKey,
		onNavigate,
		expanded = $bindable(true),
		onWidthChange,
		subnav,
		status,
		children
	}: Props<TKey> = $props();

	const topItems = $derived(navItems.filter((item) => !item.footer));
	const footerItems = $derived(navItems.filter((item) => item.footer));

	$effect(() => {
		onWidthChange?.(expanded ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH);
	});
</script>

{#snippet navButton(item: NavItem<TKey>)}
	{@const active = activeKey === item.key}
	<button
		type="button"
		aria-current={active ? 'page' : undefined}
		title={expanded ? undefined : item.label}
		onclick={() => onNavigate(item.key)}
		class={cn(
			'group relative flex h-9 w-full cursor-pointer items-center gap-2.5 rounded-md text-sm transition-colors duration-150',
			'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
			expanded ? 'px-2.5' : 'justify-center px-0',
			active
				? 'bg-primary/10 font-medium text-foreground'
				: 'text-muted-foreground hover:bg-muted hover:text-foreground'
		)}
	>
		<!-- Accent rail marks the active item; aria-current carries the same meaning for AT. -->
		<span
			aria-hidden="true"
			class={cn(
				'absolute top-1.5 bottom-1.5 left-0 w-[3px] rounded-r-full bg-primary transition-opacity duration-150',
				active ? 'opacity-100' : 'opacity-0'
			)}
		></span>
		<item.icon class="size-4 shrink-0" />
		{#if expanded}
			<span class="flex-1 truncate text-left">{item.label}</span>
			{#if item.status}
				<span
					aria-hidden="true"
					class={cn(
						'size-1.5 shrink-0 rounded-full',
						item.status === 'connected' ? 'bg-primary' : 'bg-muted-foreground/40'
					)}
				></span>
				<span class="sr-only">{item.status === 'connected' ? 'Signed in' : 'Not signed in'}</span>
			{/if}
		{/if}
	</button>
{/snippet}

<aside
	class={cn(
		'flex h-full flex-col overflow-hidden border-r bg-card/70 backdrop-blur-xl transition-[width] duration-150',
		expanded ? 'w-60' : 'w-14'
	)}
>
	<div
		class={cn('flex h-9 shrink-0 items-center', expanded ? 'justify-end pr-1.5' : 'justify-center')}
	>
		<button
			type="button"
			onclick={() => (expanded = !expanded)}
			aria-label={expanded ? 'Collapse menu' : 'Expand menu'}
			aria-expanded={expanded}
			class="flex size-8 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
		>
			<PanelLeftIcon class="size-4" />
		</button>
	</div>

	<div class="min-h-0 flex-1 overflow-y-auto px-1.5">
		<nav class="flex flex-col gap-0.5">
			{#each topItems as item (item.key)}
				{@render navButton(item)}
				{#if expanded && activeKey === item.key && subnav}
					<div class="my-1 ml-4 border-l border-border/60 pl-1.5">
						{@render subnav(item.key)}
					</div>
				{/if}
			{/each}
		</nav>
		{#if expanded}
			{@render children?.()}
		{/if}
	</div>

	{#if status && expanded}
		<div class="shrink-0 px-1.5 pb-1">
			{@render status()}
		</div>
	{/if}

	{#if footerItems.length > 0}
		<nav class="flex shrink-0 flex-col gap-0.5 border-t px-1.5 py-1.5">
			{#each footerItems as item (item.key)}
				{@render navButton(item)}
			{/each}
		</nav>
	{/if}
</aside>
