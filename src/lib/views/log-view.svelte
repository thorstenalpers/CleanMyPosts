<script lang="ts">
	import type { LogEntry } from '$lib/bridge/contract';
	import type { LogStore } from '$lib/stores/log.svelte';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { cn } from '$lib/utils';
	import { t } from '$lib/i18n/index.svelte';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import ArrowDownIcon from '@lucide/svelte/icons/arrow-down';
	import ArrowUpIcon from '@lucide/svelte/icons/arrow-up';
	import SearchIcon from '@lucide/svelte/icons/search';

	interface Props {
		logStore: LogStore;
	}

	let { logStore }: Props = $props();

	let follow = $state(true);
	let scroller = $state<HTMLDivElement | undefined>(undefined);

	const levels = [
		{ value: 'all' as const, label: 'log.level.all' as const },
		{ value: 'debug' as const, label: 'log.level.debug' as const },
		{ value: 'info' as const, label: 'log.level.info' as const },
		{ value: 'warning' as const, label: 'log.level.warning' as const },
		{ value: 'error' as const, label: 'log.level.error' as const }
	];

	type Column = 'time' | 'level' | 'message';

	// Time ascending by default: newest last, like a terminal, which is also what
	// follow-to-bottom assumes. Any other order turns that off — see the effect below.
	let sortBy = $state<Column>('time');
	let ascending = $state(true);

	const LEVEL_ORDER: Record<string, number> = { debug: 0, info: 1, warning: 2, error: 3 };

	function compare(a: LogEntry, b: LogEntry): number {
		if (sortBy === 'level') return LEVEL_ORDER[a.level]! - LEVEL_ORDER[b.level]!;
		if (sortBy === 'message') return a.message.localeCompare(b.message);
		return a.timestamp.localeCompare(b.timestamp);
	}

	const entries = $derived(
		logStore.entries
			.filter(
				(entry) =>
					(logStore.levelFilter === 'all' || entry.level === logStore.levelFilter) &&
					(logStore.messageFilter === '' ||
						entry.message.toLowerCase().includes(logStore.messageFilter.toLowerCase()))
			)
			// Sorted on a copy: `logStore.entries` is the arrival order, and the log's own
			// notion of "latest" must not depend on how the table happens to be sorted.
			.slice()
			.sort((a, b) => (ascending ? compare(a, b) : -compare(a, b)))
	);

	const columns: {
		key: Column;
		label: 'log.column.time' | 'log.column.level' | 'log.column.message';
		class: string;
	}[] = [
		{ key: 'time', label: 'log.column.time', class: 'w-24' },
		{ key: 'level', label: 'log.column.level', class: 'w-20' },
		{ key: 'message', label: 'log.column.message', class: '' }
	];

	function sort(column: Column): void {
		if (sortBy === column) {
			ascending = !ascending;
		} else {
			sortBy = column;
			ascending = column !== 'time';
		}
	}

	/** Following the tail only means anything while the table is in arrival order. */
	const following = $derived(follow && sortBy === 'time' && ascending);

	const counts = $derived({
		warning: logStore.entries.filter((e) => e.level === 'warning').length,
		error: logStore.entries.filter((e) => e.level === 'error').length
	});

	$effect(() => {
		// Touch `entries` so this re-runs whenever a line arrives.
		void entries.length;
		if (following && scroller) {
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
			<table class="w-full font-mono text-xs">
				<thead class="sticky top-0 z-10 bg-background/95 backdrop-blur">
					<tr class="border-b text-muted-foreground">
						{#each columns as column (column.key)}
							<th
								class={cn('p-0 text-start font-medium', column.class)}
								aria-sort={sortBy === column.key
									? ascending
										? 'ascending'
										: 'descending'
									: 'none'}
							>
								<button
									type="button"
									onclick={() => sort(column.key)}
									aria-label={t('log.sortBy', { column: t(column.label) })}
									class="flex h-8 w-full cursor-pointer items-center gap-1 px-4 transition-colors duration-150 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
								>
									{t(column.label)}
									{#if sortBy === column.key}
										{#if ascending}
											<ArrowUpIcon class="size-3" />
										{:else}
											<ArrowDownIcon class="size-3" />
										{/if}
									{/if}
								</button>
							</th>
						{/each}
					</tr>
				</thead>
				<tbody class="divide-y divide-border/40">
					{#each entries as entry, i (`${entry.timestamp}-${i}`)}
						<tr class={cn(entry.level === 'error' && 'bg-destructive/5')}>
							<td class="px-4 py-1.5 align-top text-muted-foreground tabular-nums">
								<time datetime={entry.timestamp}>{formatTime(entry.timestamp)}</time>
							</td>
							<td
								class={cn(
									'px-4 py-1.5 align-top uppercase',
									entry.level === 'error'
										? 'font-medium text-destructive'
										: 'text-muted-foreground',
									entry.level === 'warning' && 'text-foreground'
								)}
							>
								{entry.level === 'warning' ? 'warn' : entry.level}
							</td>
							<td class="px-4 py-1.5 break-words whitespace-pre-wrap">{entry.message}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>

	{#if !following}
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
