<script lang="ts">
	import { Progress } from '$lib/components/ui/progress';
	import SquareIcon from '@lucide/svelte/icons/square';

	interface Props {
		label: string;
		deletedCount: number;
		onStop: () => void;
	}

	let { label, deletedCount, onStop }: Props = $props();
</script>

<div class="flex flex-col gap-1.5 rounded-md border border-border/60 bg-background/60 p-2">
	<div class="flex items-center gap-2">
		<div class="min-w-0 flex-1">
			<p class="truncate text-[13px] font-medium">Deleting {label}</p>
			<p class="text-xs text-muted-foreground tabular-nums">{deletedCount} removed so far</p>
		</div>
		<button
			type="button"
			onclick={onStop}
			class="flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-border px-2 text-xs font-medium transition-colors duration-150 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
		>
			<SquareIcon class="size-3 fill-current" />
			Stop
		</button>
	</div>
	<Progress label={`Deleting ${label}`} />
</div>
