<script lang="ts">
	import type { LogStore } from '$lib/stores/log.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { cn } from '$lib/utils';
	import { t } from '$lib/i18n/index.svelte';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import SearchIcon from '@lucide/svelte/icons/search';

	interface Props {
		logStore: LogStore;
	}

	let { logStore }: Props = $props();

	let follow = $state(true);
	let scroller = $state<HTMLDivElement | undefined>(undefined);

	const levels = [
		{ value: 'all' as const, label: 'log.level.all' as const },
		{ value: 'info' as const, label: 'log.level.info' as const },
		{ value: 'warning' as const, label: 'log.level.warning' as const },
		{ value: 'error' as const, label: 'log.level.error' as const }
	];

	// Newest last, like a terminal: the interesting line is the one that just arrived.
	const entries = $derived(
		logStore.entries.filter(
			(entry) =>
				(logStore.levelFilter === 'all' || entry.level === logStore.levelFilter) &&
				(logStore.messageFilter === '' ||
					entry.message.toLowerCase().includes(logStore.messageFilter.toLowerCase()))
		)
	);

	const counts = $derived({
		warning: logStore.entries.filter((e) => e.level === 'warning').length,
		error: logStore.entries.filter((e) => e.level === 'error').length
	});

	$effect(() => {
		// Touch `entries` so this re-runs whenever a line arrives.
		void entries.length;
		if (follow && scroller) {
			scroller.scrollTop = scroller.scrollHeight;
		}
	});

	function onScroll(): void {
		if (!scroller) return;
		// Re-arm follow only once the user is back at the bottom, so reading history is not
		// interrupted by every incoming line.
		follow = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 24;
	}

	function formatTime(timestamp: string): string {
		return new Date(timestamp).toLocaleTimeString(undefined, { hour12: false });
	}
</script>

<div class="flex h-full flex-col">
	<header class="flex shrink-0 flex-wrap items-center gap-2 border-b px-4 py-2.5">
		<h1 class="mr-1 text-[13px] font-semibold tracking-tight">{t('log.title')}</h1>

		{#if counts.error > 0}
			<Badge variant="destructive">{t('log.errors', { count: counts.error })}</Badge>
		{/if}
		{#if counts.warning > 0}
			<Badge>{t('log.warnings', { count: counts.warning })}</Badge>
		{/if}

		<div class="relative ml-auto">
			<SearchIcon
				class="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground"
			/>
			<Input
				placeholder={t('log.filter')}
				bind:value={logStore.messageFilter}
				class="h-8 w-44 pl-7 text-xs"
				aria-label={t('log.filterLabel')}
			/>
		</div>

		<div class="flex gap-0.5" role="group" aria-label={t('log.levelLabel')}>
			{#each levels as level (level.value)}
				{@const active = logStore.levelFilter === level.value}
				<button
					type="button"
					aria-pressed={active}
					onclick={() => (logStore.levelFilter = level.value)}
					class={cn(
						'h-8 cursor-pointer rounded-md px-2 text-xs font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
						active ? 'bg-primary/10 text-foreground' : 'text-muted-foreground hover:bg-muted'
					)}
				>
					{t(level.label)}
				</button>
			{/each}
		</div>

		<button
			type="button"
			onclick={() => logStore.clear()}
			class="flex h-8 cursor-pointer items-center gap-1.5 rounded-md border border-border px-2 text-xs font-medium transition-colors duration-150 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
		>
			<Trash2Icon class="size-3.5" />
			{t('log.clear')}
		</button>
	</header>

	<div bind:this={scroller} onscroll={onScroll} class="min-h-0 flex-1 overflow-y-auto">
		{#if entries.length === 0}
			<p class="p-6 text-center text-xs text-muted-foreground">
				{logStore.entries.length === 0 ? t('log.empty') : t('log.noMatch')}
			</p>
		{:else}
			<ul class="divide-y divide-border/40 font-mono text-xs">
				{#each entries as entry, i (`${entry.timestamp}-${i}`)}
					<li class={cn('flex gap-3 px-4 py-1.5', entry.level === 'error' && 'bg-destructive/5')}>
						<time class="shrink-0 text-muted-foreground tabular-nums" datetime={entry.timestamp}>
							{formatTime(entry.timestamp)}
						</time>
						<span
							class={cn(
								'w-12 shrink-0 uppercase',
								entry.level === 'error' ? 'font-medium text-destructive' : 'text-muted-foreground',
								entry.level === 'warning' && 'text-foreground'
							)}
						>
							{entry.level === 'warning' ? 'warn' : entry.level}
						</span>
						<span class="break-words whitespace-pre-wrap">{entry.message}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</div>

	{#if !follow}
		<button
			type="button"
			onclick={() => {
				follow = true;
				if (scroller) scroller.scrollTop = scroller.scrollHeight;
			}}
			class="absolute right-6 bottom-6 flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-background px-3 text-xs font-medium shadow-sm transition-colors duration-150 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
		>
			<ArrowDownIcon class="size-3.5" />
			{t('log.jump')}
		</button>
	{/if}
</div>
