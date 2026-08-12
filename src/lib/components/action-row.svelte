<script lang="ts">
	import type { Component } from 'svelte';
	import { cn } from '$lib/utils';
	import { t } from '$lib/i18n/index.svelte';
	import type { MessageKey } from '$lib/i18n/index.svelte';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';

	interface Props {
		label: MessageKey;
		icon: Component;
		disabled?: boolean;
		/**
		 * Disables deleting while leaving the row itself live.
		 *
		 * For a platform that is not signed in: the page is exactly where somebody has to go
		 * about that, so the half of the row that opens it stays available.
		 */
		deleteDisabled?: boolean;
		/** Marks the row whose deletion is currently running. */
		active?: boolean;
		/** Marks the row whose page is the one on screen. */
		current?: boolean;
		onShow: () => void;
		onDelete: () => void;
	}

	let {
		label,
		icon: Icon,
		disabled = false,
		deleteDisabled = false,
		active = false,
		current = false,
		onShow,
		onDelete
	}: Props = $props();

	const iconButton =
		'flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors duration-150 ' +
		'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none ' +
		'disabled:pointer-events-none disabled:opacity-40';
</script>

<div
	class={cn(
		'group/row flex h-8 items-center rounded-md pe-0.5 transition-colors duration-150',
		// A run outranks the selection: the row being emptied is the one worth pointing at.
		active ? 'bg-primary/10' : current ? 'bg-muted' : 'hover:bg-muted'
	)}
>
	<!-- The row itself opens the page: that is what a person came to this list for, and it
	     leaves deletion as the one thing that needs its own target to hit. -->
	<button
		type="button"
		aria-label={t('action.show', { label: t(label) })}
		aria-current={current ? 'page' : undefined}
		{disabled}
		onclick={onShow}
		class="flex h-full min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-s-md ps-2 text-start focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
	>
		<Icon
			class={cn('size-3.5 shrink-0', active || current ? 'text-primary' : 'text-muted-foreground')}
		/>
		<span class={cn('flex-1 truncate text-[13px]', current && 'font-medium')}>{t(label)}</span>
	</button>

	<!-- Always in the layout, only its contrast revealed on hover, so the row never reflows
	     and keyboard users always see a target. -->
	<button
		type="button"
		aria-label={t('action.delete', { label: t(label) })}
		disabled={disabled || deleteDisabled}
		onclick={onDelete}
		class={cn(
			iconButton,
			'text-muted-foreground/60 group-hover/row:text-destructive hover:bg-destructive/10 hover:text-destructive focus-visible:text-destructive'
		)}
	>
		<Trash2Icon class="size-3.5" />
	</button>
</div>
