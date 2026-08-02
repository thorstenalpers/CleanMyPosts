<script lang="ts">
	import { accentPresets, isValidHex } from '$lib/theme/accent';
	import { Input } from '$lib/components/ui/input';
	import { Switch } from '$lib/components/ui/switch';
	import { cn } from '$lib/utils';
	import CheckIcon from '@lucide/svelte/icons/check';

	interface Props {
		value: string;
		useSystemAccent: boolean;
		onChange: (value: string) => void;
		onUseSystemAccentChange: (value: boolean) => void;
	}

	let { value, useSystemAccent, onChange, onUseSystemAccentChange }: Props = $props();

	let draft = $state('');
	$effect(() => {
		draft = value;
	});

	function commitDraft(next: string): void {
		draft = next;
		if (isValidHex(next)) {
			onChange(next);
		}
	}

	const selected = $derived(value.toLowerCase());
</script>

<div class="flex flex-col gap-3">
	<div class="flex items-start justify-between gap-6">
		<div class="min-w-0">
			<p class="text-[13px] font-medium">Accent colour</p>
			<p class="mt-0.5 text-xs leading-relaxed text-muted-foreground">
				Used for selection, focus, and the primary action. Red always means deletion and never
				changes.
			</p>
		</div>
		<div class="flex shrink-0 items-center gap-2">
			<label class="text-xs text-muted-foreground" for="use-system-accent">Follow Windows</label>
			<Switch
				id="use-system-accent"
				checked={useSystemAccent}
				onCheckedChange={onUseSystemAccentChange}
			/>
		</div>
	</div>

	<div
		class={cn(
			'flex flex-wrap items-center gap-1.5',
			useSystemAccent && 'pointer-events-none opacity-40'
		)}
	>
		{#each accentPresets as preset (preset.hex)}
			{@const active = selected === preset.hex.toLowerCase()}
			<button
				type="button"
				title={preset.name}
				aria-label={preset.name}
				aria-pressed={active}
				disabled={useSystemAccent}
				onclick={() => commitDraft(preset.hex)}
				class={cn(
					'flex size-7 cursor-pointer items-center justify-center rounded-full ring-offset-background transition-transform duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none',
					active ? 'scale-110' : 'hover:scale-105'
				)}
				style="background-color: {preset.hex}"
			>
				{#if active}
					<CheckIcon class="size-3.5 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]" />
				{/if}
			</button>
		{/each}

		<!-- Divider: without it the live preview swatch reads as a ninth preset. -->
		<div class="ml-1.5 flex items-center gap-1.5 border-l border-border/60 pl-3">
			<span
				class="size-7 shrink-0 rounded-full border border-border"
				style="background-color: {isValidHex(draft) ? draft : 'transparent'}"
			></span>
			<Input
				aria-label="Custom accent colour, hex"
				class="h-8 w-24 font-mono text-xs uppercase"
				maxlength={7}
				disabled={useSystemAccent}
				value={draft}
				oninput={(e) => commitDraft(e.currentTarget.value)}
			/>
		</div>
	</div>
</div>
