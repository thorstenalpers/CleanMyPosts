<script lang="ts">
	import type { Component } from 'svelte';
	import { cn } from '$lib/utils';
	import { t } from '$lib/i18n/index.svelte';
	import type { MessageKey } from '$lib/i18n/index.svelte';
	import ListIcon from '@lucide/svelte/icons/list';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';

	interface Props {
		label: MessageKey;
		icon: Component;
		disabled?: boolean;
		/** Marks the row whose deletion is currently running. */
		active?: boolean;
		onShow: () => void;
		onDelete: () => void;
	}

	let { label, icon: Icon, disabled = false, active = false, onShow, onDelete }: Props = $props();

	const iconButton =
		'flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors duration-150 ' +
		'focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none ' +
		'disabled:pointer-events-none disabled:opacity-40';
</script>

<div
	class={cn(
		'group/row flex h-8 items-center gap-2 rounded-md pr-0.5 pl-2 transition-colors duration-150',
		active ? 'bg-primary/10' : 'hover:bg-muted'
	)}
>
	<Icon class={cn('size-3.5 shrink-0', active ? 'text-primary' : 'text-muted-foreground')} />
	<span class="flex-1 truncate text-[13px]">{t(label)}</span>

	<!-- Buttons stay in the layout at all times; only their contrast is revealed on hover,
       so the row never reflows and keyboard users always see a target. -->
	<button
		type="button"
		aria-label={t('action.show', { label: t(label) })}
		{disabled}
		onclick={onShow}
		class={cn(
			iconButton,
			'text-muted-foreground/60 group-hover/row:text-muted-foreground hover:bg-background hover:text-foreground focus-visible:text-foreground'
		)}
	>
		<ListIcon class="size-3.5" />
	</button>
	<button
		type="button"
		aria-label={t('action.delete', { label: t(label) })}
		{disabled}
		onclick={onDelete}
		class={cn(
			iconButton,
			'text-muted-foreground/60 group-hover/row:text-destructive hover:bg-destructive/10 hover:text-destructive focus-visible:text-destructive'
		)}
	>
		<Trash2Icon class="size-3.5" />
	</button>
</div>
