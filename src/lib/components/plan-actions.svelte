<script lang="ts">
	/**
	 * What can be done with an answer once it turns out to be a plan.
	 *
	 * Its own component because there are two places an answer arrives — the assistant page and
	 * the panel that opens beside a platform — and the order of these four buttons is a
	 * judgement about safety, not layout. One implementation means it cannot be right in one
	 * place and wrong in the other.
	 */
	import type { BridgeClient } from '$lib/bridge/client';
	import type { SettingsStore } from '$lib/stores/settings.svelte';
	import type { ActionRunner } from '$lib/stores/action-runner.svelte';
	import type { CustomAction, Platform } from '$lib/bridge/contract';
	import { parseActionPlan } from '$lib/assistant-context';
	import { notify } from '$lib/notify';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { t } from '$lib/i18n/index.svelte';
	import ScanEyeIcon from '@lucide/svelte/icons/scan-eye';
	import PlayIcon from '@lucide/svelte/icons/play';
	import SaveIcon from '@lucide/svelte/icons/save';

	interface Props {
		bridge: BridgeClient;
		settingsStore: SettingsStore;
		runner: ActionRunner;
		/** The model's answer, verbatim. Whether it is a plan is this component's question. */
		answer: string;
		/** Where a plan would act. Absent means no platform is signed in, and nothing can be tried. */
		platform: Platform | undefined;
	}

	let { bridge, settingsStore, runner, answer, platform }: Props = $props();

	// Read straight off the answer rather than kept beside it: there is one answer on screen at
	// a time, and a second copy of what it means is a second thing that can be stale.
	const parsed = $derived(answer.trim() === '' ? undefined : parseActionPlan(answer));
	const plan = $derived(parsed && 'plan' in parsed ? parsed.plan : undefined);

	let busy = $state(false);
	let outcome = $state('');
	let failure = $state('');

	/**
	 * The dry run.
	 *
	 * First of the four and the only one that changes nothing. Between a plan arriving and a
	 * plan being allowed to delete there has to be a step that costs nothing, or a wrong
	 * selector is found out only after it has clicked a hundred times.
	 */
	async function countMatches(): Promise<void> {
		const target = plan?.target;
		if (!target || !platform || busy) return;
		busy = true;
		outcome = '';
		failure = '';
		try {
			const result = await bridge.call('site.countMatches', { platform, target });
			outcome = t('assistant.plan.matches', { count: result.count });
		} catch (cause) {
			failure = cause instanceof Error ? cause.message : String(cause);
		} finally {
			busy = false;
		}
	}

	/** Runs it on the page that is open, once. Everything a run has applies to it. */
	async function runOnce(): Promise<void> {
		if (!plan || !platform || busy) return;
		busy = true;
		outcome = '';
		failure = '';
		try {
			const result = await runner.runPlan({
				platform,
				plan,
				timeouts: settingsStore.settings.timeouts
			});
			outcome = t('assistant.plan.removed', { count: result.deletedCount });
		} catch (cause) {
			failure = cause instanceof Error ? cause.message : String(cause);
		} finally {
			busy = false;
		}
	}

	// Asked for rather than invented: a saved action becomes a row somebody clicks months from
	// now, and "Plan 3" is not something anyone can tell apart from "Plan 4".
	let naming = $state(false);
	let actionName = $state('');

	/**
	 * Keeps the plan as a row in that platform's action panel.
	 *
	 * A second, named step rather than something that happens because a plan parsed: what is
	 * being kept is a thing that will delete without being read again.
	 */
	function saveAsAction(): void {
		if (!plan || !platform || actionName.trim() === '') return;
		const action: CustomAction = {
			id: crypto.randomUUID(),
			label: actionName.trim().slice(0, 60),
			platform,
			// Decided by what the plan is, not asked for: a deletion belongs beside that
			// platform's other lists, and something that opens a page or dismisses a banner
			// belongs in the navigation, because it has no list to sit next to.
			place: plan.kind === 'once' ? 'sidebar' : 'panel',
			plan,
			createdAt: new Date().toISOString()
		};
		void settingsStore.update({
			...settingsStore.settings,
			customActions: [...settingsStore.settings.customActions, action]
		});
		notify(settingsStore, 'success', t('assistant.plan.saved', { label: action.label }));
		naming = false;
		actionName = '';
	}
</script>

<!-- Said plainly rather than left to the buttons being absent: an answer that is not a plan
     looks exactly like one that is, and the reason it was refused is the only thing that gets
     the next question right. -->
{#if parsed && 'error' in parsed}
	<p class="text-xs text-destructive">{t('assistant.plan.rejected', { reason: parsed.error })}</p>
{:else if plan && !platform}
	<p class="text-xs text-muted-foreground">{t('assistant.plan.noPlatform')}</p>
{:else if failure}
	<p class="text-xs text-destructive">{failure}</p>
{:else if outcome}
	<p class="text-xs text-muted-foreground">{outcome}</p>
{/if}

{#if plan}
	<div class="flex flex-wrap gap-2">
		<!-- Only where there is something to count: a plan that opens a page or dismisses a
		     banner has no list to be checked against. -->
		{#if plan.target}
			<Button
				variant="outline"
				size="sm"
				class="h-8"
				disabled={busy || !platform}
				onclick={countMatches}
			>
				<ScanEyeIcon />
				{t('assistant.plan.count')}
			</Button>
		{/if}
		<Button size="sm" class="h-8" disabled={busy || !platform} onclick={runOnce}>
			<PlayIcon />
			{t('assistant.plan.run')}
		</Button>
		<Button
			variant="outline"
			size="sm"
			class="h-8"
			disabled={!platform}
			onclick={() => (naming = true)}
		>
			<SaveIcon />
			{t('assistant.plan.save')}
		</Button>
	</div>

	{#if naming}
		<form
			class="flex gap-2"
			onsubmit={(event: SubmitEvent) => {
				event.preventDefault();
				saveAsAction();
			}}
		>
			<Input
				class="h-8 flex-1"
				placeholder={t('assistant.plan.name')}
				aria-label={t('assistant.plan.name')}
				bind:value={actionName}
			/>
			<Button type="submit" size="sm" class="h-8" disabled={actionName.trim() === ''}>
				{t('assistant.plan.keep')}
			</Button>
		</form>
	{/if}
{/if}
