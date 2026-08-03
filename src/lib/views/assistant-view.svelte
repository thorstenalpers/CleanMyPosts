<script lang="ts">
	import type { BridgeClient } from '$lib/bridge/client';
	import type { LogStore } from '$lib/stores/log.svelte';
	import type { AssistantSources } from '$lib/bridge/contract';
	import { buildPrompt } from '$lib/assistant-context';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { i18n, t } from '$lib/i18n/index.svelte';
	import { cn } from '$lib/utils';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import SendIcon from '@lucide/svelte/icons/send';
	import ShieldIcon from '@lucide/svelte/icons/shield';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';

	interface Props {
		bridge: BridgeClient;
		logStore: LogStore;
		onOpenSettings: () => void;
	}

	let { bridge, logStore, onOpenSettings }: Props = $props();

	let question = $state('');
	let answer = $state('');
	let error = $state('');
	let asking = $state(false);
	let sources = $state<AssistantSources | undefined>(undefined);

	$effect(() => {
		void bridge.call('assistant.getSources', undefined).then((next) => (sources = next));
	});

	/**
	 * Whether anything can answer at all: the local binary has to be on disk, and a hosted
	 * provider has to have a key. Saying so up front beats a failed round-trip.
	 */
	const ready = $derived(
		sources
			? sources.local.found || sources.providers.some((provider) => provider.hasKey)
			: undefined
	);

	/** Named in English because the prompt is. */
	function languageName(): string {
		return new Intl.DisplayNames(['en'], { type: 'language' }).of(i18n.locale) ?? 'English';
	}

	async function ask(): Promise<void> {
		if (asking || question.trim() === '') return;
		asking = true;
		error = '';
		answer = '';
		try {
			const result = await bridge.call('assistant.ask', {
				prompt: buildPrompt(question, logStore.entries, languageName())
			});
			answer = result.text;
		} catch (cause) {
			error = cause instanceof Error ? cause.message : String(cause);
		} finally {
			asking = false;
		}
	}
</script>

<div class="h-full overflow-y-auto">
	<div class="mx-auto flex max-w-2xl flex-col gap-4 p-5">
		<header>
			<h1 class="flex items-center gap-2 text-xl font-semibold tracking-tight">
				<SparklesIcon class="size-4 text-muted-foreground" />
				{t('assistant.title')}
			</h1>
			<p class="mt-0.5 text-xs text-muted-foreground">{t('assistant.subtitle')}</p>
		</header>

		{#if ready === false}
			<Card>
				<CardContent class="flex flex-wrap items-center gap-3 py-4">
					<p class="min-w-0 flex-1 text-sm text-muted-foreground">{t('assistant.noSource')}</p>
					<Button variant="outline" size="sm" class="h-8" onclick={onOpenSettings}>
						{t('assistant.openSettings')}
					</Button>
				</CardContent>
			</Card>
		{/if}

		<form
			class="flex gap-2"
			onsubmit={(event: SubmitEvent) => {
				event.preventDefault();
				void ask();
			}}
		>
			<Input
				class="h-9 flex-1"
				placeholder={t('assistant.placeholder')}
				bind:value={question}
				disabled={asking || ready === false}
			/>
			<Button type="submit" size="sm" class="h-9" disabled={asking || question.trim() === ''}>
				<SendIcon class={cn(asking && 'animate-pulse')} />
				{asking ? t('assistant.asking') : t('assistant.ask')}
			</Button>
		</form>

		<p class="flex items-start gap-1.5 text-xs text-muted-foreground">
			<ShieldIcon class="mt-0.5 size-3.5 shrink-0" />
			{t('assistant.sendsLog')}
		</p>

		{#if error}
			<p class="text-sm text-destructive">{error}</p>
		{/if}

		{#if answer}
			<Card>
				<CardContent class="py-4">
					<p class="text-sm whitespace-pre-wrap">{answer}</p>
					<Button
						variant="ghost"
						size="sm"
						class="mt-3 h-8"
						onclick={() => {
							answer = '';
							error = '';
						}}
					>
						<Trash2Icon />
						{t('assistant.clear')}
					</Button>
				</CardContent>
			</Card>
		{/if}

		{#if sources && sources.local.found && sources.local.version}
			<p class="text-xs text-muted-foreground">
				{t('settings.assistant.cliFound', { version: sources.local.version })}
			</p>
		{/if}
	</div>
</div>
