<script lang="ts">
	import type { ActionRunner } from '$lib/stores/action-runner.svelte';
	import type { Platform } from '$lib/bridge/contract';
	import { Progress } from '$lib/components/ui/progress';
	import { t } from '$lib/i18n/index.svelte';
	import { cn } from '$lib/utils';
	import SquareIcon from '@lucide/svelte/icons/square';
	import CheckIcon from '@lucide/svelte/icons/check';
	import InfoIcon from '@lucide/svelte/icons/info';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

	interface Props {
		runner: ActionRunner;
		/** Whose bar this is. Each platform keeps its own last line. */
		platform: Platform;
	}

	let { runner, platform }: Props = $props();

	const result = $derived(runner.lastResult[platform]);
</script>

<!-- The full width of the window, below the platform view: the host shortens the site rather
     than letting this float over it, because one webview cannot paint on top of another. -->
<footer class="flex h-9 shrink-0 items-center gap-3 border-t bg-background px-3" aria-live="polite">
	<div class="flex shrink-0 items-center gap-2">
		{#if runner.running}
			<button
				type="button"
				onclick={() => runner.cancel()}
				class="flex h-6 cursor-pointer items-center gap-1.5 rounded-md border border-border px-2 text-xs font-medium transition-colors duration-150 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
			>
				<SquareIcon class="size-3 fill-current" />
				{t('run.stop')}
			</button>
			<div class="w-28">
				<Progress label={t('run.deleting', { label: t(runner.currentLabel ?? 'nav.overview') })} />
			</div>
		{/if}
	</div>

	<!-- The outcome carries its own colour: after a run that took minutes, the one thing worth
	     seeing at a glance is whether it worked. Both foreground and background move, so it
	     reads as a state and not only as a shade of text. -->
	<div class="flex min-w-0 flex-1 justify-end">
		{#if runner.running && runner.currentLabel}
			<p class="min-w-0 truncate text-xs text-muted-foreground">
				{t('run.deleting', { label: t(runner.currentLabel) })} · {t('run.removedSoFar', {
					count: runner.deletedSoFar
				})}
			</p>
		{:else if result}
			<p
				class={cn(
					'flex min-w-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium',
					result.kind === 'error'
						? 'bg-destructive/10 text-destructive'
						: result.kind === 'info'
							? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
							: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
				)}
			>
				{#if result.kind === 'error'}
					<TriangleAlertIcon class="size-3.5 shrink-0" />
				{:else if result.kind === 'info'}
					<InfoIcon class="size-3.5 shrink-0" />
				{:else}
					<CheckIcon class="size-3.5 shrink-0" />
				{/if}
				<span class="truncate">{result.message}</span>
			</p>
		{:else}
			<p class="min-w-0 truncate text-xs text-muted-foreground">{t('overview.now.idle')}</p>
		{/if}
	</div>
</footer>
