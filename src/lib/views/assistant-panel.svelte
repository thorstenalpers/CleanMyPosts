<script lang="ts">
	/**
	 * The assistant, beside the platform rather than instead of it.
	 *
	 * It lives in the column the app owns — left of the site webview, next to the action rail —
	 * and that is not a layout preference. The platform page is a webview laid on top of this
	 * one, so anything floating over it would either be painted behind it or have to push it
	 * off screen. Beside it is the only arrangement where a person can look at the page they
	 * are asking about while they ask.
	 *
	 * The conversation is kept here and folded into each request. `assistant.ask` is one round
	 * trip with no memory of its own; a model that cannot see what it just said answers the
	 * second question as if it were the first.
	 */
	import type { BridgeClient } from '$lib/bridge/client';
	import type { LogStore } from '$lib/stores/log.svelte';
	import type { SettingsStore } from '$lib/stores/settings.svelte';
	import type { SiteLoginStore } from '$lib/stores/site-login.svelte';
	import type { ActionRunner } from '$lib/stores/action-runner.svelte';
	import type { AssistantEffort, AssistantSources, Platform } from '$lib/bridge/contract';
	import { LOCAL_ASSISTANT_SOURCE } from '$lib/bridge/contract';
	import { buildPrompt } from '$lib/assistant-context';
	import PlanActions from '$lib/components/plan-actions.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { i18n, t } from '$lib/i18n/index.svelte';
	import { cn } from '$lib/utils';
	import XIcon from '@lucide/svelte/icons/x';
	import SendIcon from '@lucide/svelte/icons/send';
	import SlidersIcon from '@lucide/svelte/icons/sliders-horizontal';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import CheckIcon from '@lucide/svelte/icons/check';

	interface Props {
		bridge: BridgeClient;
		logStore: LogStore;
		settingsStore: SettingsStore;
		loginStore: SiteLoginStore;
		runner: ActionRunner;
		onClose: () => void;
	}

	let { bridge, logStore, settingsStore, loginStore, runner, onClose }: Props = $props();

	interface Turn {
		who: 'user' | 'assistant';
		text: string;
	}

	let turns = $state<Turn[]>([]);
	let question = $state('');
	let asking = $state(false);
	let error = $state('');
	let controlsOpen = $state(false);
	let structure = $state<string | undefined>(undefined);

	let sources = $state<AssistantSources | undefined>(undefined);
	$effect(() => {
		void bridge.call('assistant.getSources', undefined).then((next) => (sources = next));
	});

	/** Only what can actually answer: a provider without a key is not a choice, it is a dead end. */
	const usable = $derived([
		...(sources?.local.found ? [{ id: LOCAL_ASSISTANT_SOURCE, label: 'Claude Code' }] : []),
		...(sources?.providers ?? [])
			.filter((provider) => provider.hasKey)
			.map((provider) => ({ id: provider.id, label: provider.label }))
	]);

	const activeSource = $derived(
		usable.find((entry) => entry.id === settingsStore.settings.assistantSource)
	);

	const EFFORTS: {
		value: AssistantEffort;
		label: 'assistant.effort.low' | 'assistant.effort.medium' | 'assistant.effort.high';
	}[] = [
		{ value: 'low', label: 'assistant.effort.low' },
		{ value: 'medium', label: 'assistant.effort.medium' },
		{ value: 'high', label: 'assistant.effort.high' }
	];

	/** The local binary picks its own model and answers at whatever length the task needs. */
	const hosted = $derived(settingsStore.settings.assistantSource !== LOCAL_ASSISTANT_SOURCE);

	const platform = $derived<Platform | undefined>(
		loginStore.loggedIn.x ? 'x' : loginStore.loggedIn.youtube ? 'youtube' : undefined
	);

	/** The most recent answer, which is the one the plan buttons are about. */
	const lastAnswer = $derived.by(() => {
		for (let index = turns.length - 1; index >= 0; index--) {
			const turn = turns[index];
			if (turn?.who === 'assistant') return turn.text;
		}
		return '';
	});

	function commit(next: Partial<typeof settingsStore.settings>): void {
		void settingsStore.update({ ...settingsStore.settings, ...next });
	}

	function languageName(): string {
		return new Intl.DisplayNames(['en'], { type: 'language' }).of(i18n.locale) ?? 'English';
	}

	/**
	 * The conversation, as one more section of the prompt.
	 *
	 * Folded in rather than sent as messages because the bridge takes a single string — and
	 * putting it here rather than in `assistant-context.ts` keeps that module answering for
	 * what every request carries, while this is the one surface that has a history at all.
	 */
	function conversation(): string {
		if (turns.length === 0) return '';
		return [
			'## The conversation so far',
			'',
			...turns.map((turn) => `${turn.who === 'user' ? 'User' : 'You'}: ${turn.text}`)
		].join('\n');
	}

	async function ask(): Promise<void> {
		const asked = question.trim();
		if (asking || asked === '') return;
		asking = true;
		error = '';
		question = '';
		turns = [...turns, { who: 'user', text: asked }];

		try {
			// Read at the moment of asking: the page moves while somebody types, and what the
			// answer is about has to be what was actually sent.
			if (platform) {
				try {
					const read = await bridge.call('site.readStructure', { platform });
					structure = read.structure;
				} catch {
					structure = undefined;
				}
			}

			const history = conversation();
			const prompt = buildPrompt(asked, logStore.entries, {
				language: languageName(),
				mode: 'patch',
				platform,
				structure
			});
			const result = await bridge.call('assistant.ask', {
				prompt: history ? `${prompt}\n\n${history}` : prompt
			});
			turns = [...turns, { who: 'assistant', text: result.text }];
		} catch (cause) {
			error = cause instanceof Error ? cause.message : String(cause);
		} finally {
			asking = false;
		}
	}
</script>

<aside
	aria-label={t('assistant.title')}
	class="flex h-full w-80 shrink-0 [animation:cmp-panel-in_150ms_ease-out] flex-col overflow-hidden border-e bg-card/40"
>
	<div class="flex h-12 shrink-0 items-center gap-2 px-3">
		<div class="min-w-0 flex-1">
			<p class="truncate text-[13px] leading-tight font-semibold tracking-tight">
				{t('assistant.title')}
			</p>
			<p class="truncate text-xs leading-tight text-muted-foreground">
				{activeSource?.label ?? t('assistant.noSource.short')}
			</p>
		</div>
		<button
			type="button"
			aria-label={t('assistant.controls')}
			aria-expanded={controlsOpen}
			onclick={() => (controlsOpen = !controlsOpen)}
			class="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
		>
			<SlidersIcon class="size-3.5" />
		</button>
		<button
			type="button"
			aria-label={t('assistant.close')}
			onclick={onClose}
			class="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
		>
			<XIcon class="size-3.5" />
		</button>
	</div>

	<!-- Behind a toggle: these are picked once and then never again, and a chat column is too
	     narrow to carry three permanent controls above the thing people came for. -->
	{#if controlsOpen}
		<div class="flex shrink-0 flex-col gap-2 border-t px-3 py-2.5">
			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<button
							{...props}
							type="button"
							aria-label={t('settings.assistant.source')}
							class="flex h-8 w-full cursor-pointer items-center gap-2 rounded-md border border-border px-2.5 text-xs transition-colors duration-150 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
						>
							<span class="flex-1 truncate text-start"
								>{activeSource?.label ?? t('assistant.noSource.short')}</span
							>
							<ChevronDownIcon class="size-3.5 text-muted-foreground" />
						</button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="start" class="w-56">
					{#each usable as entry (entry.id)}
						<DropdownMenu.Item onSelect={() => commit({ assistantSource: entry.id })}>
							<span class="flex-1">{entry.label}</span>
							{#if settingsStore.settings.assistantSource === entry.id}
								<CheckIcon class="size-4" />
							{/if}
						</DropdownMenu.Item>
					{/each}
				</DropdownMenu.Content>
			</DropdownMenu.Root>

			<DropdownMenu.Root>
				<DropdownMenu.Trigger>
					{#snippet child({ props })}
						<button
							{...props}
							type="button"
							aria-label={t('assistant.effort')}
							class="flex h-8 w-full cursor-pointer items-center gap-2 rounded-md border border-border px-2.5 text-xs transition-colors duration-150 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
						>
							<span class="flex-1 truncate text-start">
								{t(
									EFFORTS.find((entry) => entry.value === settingsStore.settings.assistantEffort)
										?.label ?? 'assistant.effort.medium'
								)}
							</span>
							<ChevronDownIcon class="size-3.5 text-muted-foreground" />
						</button>
					{/snippet}
				</DropdownMenu.Trigger>
				<DropdownMenu.Content align="start" class="w-56">
					{#each EFFORTS as entry (entry.value)}
						<DropdownMenu.Item onSelect={() => commit({ assistantEffort: entry.value })}>
							<span class="flex-1">{t(entry.label)}</span>
							{#if settingsStore.settings.assistantEffort === entry.value}
								<CheckIcon class="size-4" />
							{/if}
						</DropdownMenu.Item>
					{/each}
				</DropdownMenu.Content>
			</DropdownMenu.Root>

			<!-- Free text rather than a list: the app has no catalogue of what a provider offers,
			     and inventing one would be a second thing to keep in step with five vendors. -->
			{#if hosted}
				<Input
					class="h-8 text-xs"
					aria-label={t('assistant.model')}
					placeholder={t('assistant.model.default')}
					value={settingsStore.settings.assistantModel}
					onchange={(event: Event) =>
						commit({ assistantModel: (event.currentTarget as HTMLInputElement).value.trim() })}
				/>
			{/if}
		</div>
	{/if}

	<div class="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto border-t px-3 py-3">
		{#if turns.length === 0}
			<p class="text-xs text-muted-foreground">{t('assistant.panel.empty')}</p>
		{/if}

		{#each turns as turn, index (index)}
			<div
				class={cn(
					'rounded-md px-2.5 py-2 text-[13px] whitespace-pre-wrap',
					turn.who === 'user' ? 'bg-primary/10' : 'bg-muted'
				)}
			>
				{turn.text}
			</div>
		{/each}

		<!-- Only under the newest answer: an older plan in the same conversation was written
		     against a page that has since been clicked through. -->
		{#if lastAnswer && !asking}
			<PlanActions {bridge} {settingsStore} {runner} answer={lastAnswer} {platform} />
		{/if}

		{#if error}
			<p class="text-xs text-destructive">{error}</p>
		{/if}
	</div>

	<form
		class="flex shrink-0 gap-2 border-t px-3 py-2.5"
		onsubmit={(event: SubmitEvent) => {
			event.preventDefault();
			void ask();
		}}
	>
		<Input
			class="h-8 flex-1 text-xs"
			placeholder={t('assistant.placeholder.patch')}
			aria-label={t('assistant.title')}
			bind:value={question}
			disabled={asking || usable.length === 0}
		/>
		<Button type="submit" size="sm" class="h-8" disabled={asking || question.trim() === ''}>
			<SendIcon class={cn(asking && 'animate-pulse')} />
		</Button>
	</form>
</aside>
