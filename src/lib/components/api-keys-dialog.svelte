<script lang="ts">
	import { Dialog as DialogPrimitive } from 'bits-ui';
	import type { AssistantProvider } from '$lib/bridge/contract';
	import { DialogContent } from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Badge } from '$lib/components/ui/badge';
	import { t } from '$lib/i18n/index.svelte';
	import { cn } from '$lib/utils';
	import CheckIcon from '@lucide/svelte/icons/check';
	import GiftIcon from '@lucide/svelte/icons/gift';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';

	interface Props {
		open: boolean;
		providers: AssistantProvider[];
		selected: string;
		onSelect: (provider: string) => void;
		onSetKey: (provider: string, key: string) => Promise<void>;
		onOpenFreeKeyUrl: (provider: string) => void;
	}

	let {
		open = $bindable(),
		providers,
		selected,
		onSelect,
		onSetKey,
		onOpenFreeKeyUrl
	}: Props = $props();

	let saved = $state<Record<string, boolean>>({});

	async function store(provider: string, key: string): Promise<void> {
		await onSetKey(provider, key);
		saved = { ...saved, [provider]: true };
		setTimeout(() => (saved = { ...saved, [provider]: false }), 2000);
	}

	// The field is cleared on the way in: the key never comes back from the credential store,
	// so leaving it on screen would only pretend that it did.
	function onKeyInput(provider: string, event: Event): void {
		const input = event.currentTarget as HTMLInputElement;
		const value = input.value;
		input.value = '';
		void store(provider, value);
	}
</script>

<DialogPrimitive.Root bind:open>
	<DialogContent>
		<DialogPrimitive.Title class="text-lg font-semibold">
			{t('settings.assistant.keys.title')}
		</DialogPrimitive.Title>
		<DialogPrimitive.Description class="text-sm text-muted-foreground">
			{t('settings.assistant.keys.description')}
		</DialogPrimitive.Description>

		<div class="flex flex-col divide-y divide-border/60">
			{#each providers as provider (provider.id)}
				<div class="flex flex-col gap-2 py-3">
					<div class="flex items-center gap-2">
						<button
							type="button"
							aria-pressed={selected === provider.id}
							onclick={() => onSelect(provider.id)}
							class={cn(
								'flex h-8 cursor-pointer items-center rounded-md border px-2.5 text-xs font-medium transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
								selected === provider.id
									? 'border-primary/40 bg-primary/10 text-foreground'
									: 'border-border text-muted-foreground hover:bg-muted'
							)}
						>
							{provider.label}
						</button>
						<span class="font-mono text-xs text-muted-foreground">{provider.model}</span>

						{#if saved[provider.id]}
							<Badge variant="neutral" class="ml-auto gap-1 font-normal">
								<CheckIcon class="size-3" />
								{t('settings.assistant.keys.saved')}
							</Badge>
						{:else if provider.hasKey}
							<Badge variant="neutral" class="ml-auto font-normal">
								{t('settings.assistant.keys.stored')}
							</Badge>
						{:else}
							<span class="ml-auto text-xs text-muted-foreground">
								{t('settings.assistant.keys.none')}
							</span>
						{/if}
					</div>

					<div class="flex flex-wrap items-center gap-2">
						<Input
							type="password"
							class="h-8 max-w-64 font-mono text-xs"
							placeholder={t('settings.assistant.keys.placeholder')}
							onchange={(event: Event) => onKeyInput(provider.id, event)}
						/>

						{#if provider.hasKey}
							<Button
								variant="ghost"
								size="sm"
								class="h-8"
								onclick={() => void store(provider.id, '')}
							>
								{t('settings.assistant.keys.forget')}
							</Button>
						{/if}

						{#if provider.freeKeyUrl}
							<Button
								variant="ghost"
								size="sm"
								class="h-8"
								onclick={() => onOpenFreeKeyUrl(provider.id)}
							>
								<GiftIcon />
								{t('settings.assistant.keys.free')}
								<ExternalLinkIcon class="opacity-60" />
							</Button>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		<div class="flex justify-end">
			<Button variant="outline" size="sm" class="h-8" onclick={() => (open = false)}>
				{t('settings.assistant.keys.close')}
			</Button>
		</div>
	</DialogContent>
</DialogPrimitive.Root>
