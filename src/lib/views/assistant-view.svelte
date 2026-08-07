<script lang="ts">
	import type { BridgeClient } from '$lib/bridge/client';
	import type { LogStore } from '$lib/stores/log.svelte';
	import type { AppInfo, AssistantSources } from '$lib/bridge/contract';
	import {
		buildPrompt,
		describeLog,
		promptSections,
		toIssueUrl,
		type PromptMode
	} from '$lib/assistant-context';
	import type { SettingsStore } from '$lib/stores/settings.svelte';
	import { notify } from '$lib/notify';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { i18n, t } from '$lib/i18n/index.svelte';
	import { cn } from '$lib/utils';
	import WrenchIcon from '@lucide/svelte/icons/wrench';
	import SaveIcon from '@lucide/svelte/icons/save';
	import XIcon from '@lucide/svelte/icons/x';
	import SendIcon from '@lucide/svelte/icons/send';
	import ShieldIcon from '@lucide/svelte/icons/shield';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import LifeBuoyIcon from '@lucide/svelte/icons/life-buoy';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import EyeOffIcon from '@lucide/svelte/icons/eye-off';
	import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
	import BugIcon from '@lucide/svelte/icons/bug';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import TerminalIcon from '@lucide/svelte/icons/terminal';

	interface Props {
		bridge: BridgeClient;
		logStore: LogStore;
		settingsStore: SettingsStore;
		onOpenSettings: () => void;
	}

	let { bridge, logStore, settingsStore, onOpenSettings }: Props = $props();

	/** Where a report ends up. The same repository the updater already points the app at. */
	const REPO_URL = 'https://github.com/thorstenalpers/CleanMyPosts';

	let question = $state('');
	let answer = $state('');
	let error = $state('');
	let asking = $state(false);
	let previewOpen = $state(false);
	let hintOpen = $state(true);
	// Which job the request is: a question about the log, or a patch for the engine. It decides
	// one extra section in the prompt, and whether the answer can be saved as a script.
	let mode = $state<PromptMode>('question');

	const MODES = [
		{ value: 'question' as const, label: 'assistant.mode.question' as const, icon: SendIcon },
		{ value: 'patch' as const, label: 'assistant.patch' as const, icon: WrenchIcon },
		{ value: 'report' as const, label: 'assistant.report' as const, icon: BugIcon }
	];
	let sources = $state<AssistantSources | undefined>(undefined);
	let appInfo = $state<AppInfo | undefined>(undefined);

	$effect(() => {
		void bridge.call('assistant.getSources', undefined).then((next) => (sources = next));
	});

	$effect(() => {
		void bridge.call('app.getInfo', undefined).then((info) => (appInfo = info));
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

	// The preview is assembled from the same functions `buildPrompt` calls, so it cannot drift
	// from what is actually sent — a preview that only resembles the request is worse than none.
	const preview = $derived([
		...promptSections(languageName(), mode, appInfo?.version ?? '').map((section) => ({
			title: t(section.titleKey),
			body: section.body
		})),
		{ title: t('assistant.preview.log'), body: describeLog(logStore.entries) },
		{
			title: t('assistant.preview.question'),
			body: question.trim() === '' ? t('assistant.preview.noQuestion') : question.trim()
		}
	]);

	/**
	 * Saves the answer as the engine script.
	 *
	 * Deliberately the user's click, not something that happens because a model produced
	 * text: this writes code that will run inside their signed-in session on the next run.
	 */
	/**
	 * Hands the finished report to GitHub's own new-issue form, filled in.
	 *
	 * The app stops here on purpose: an issue is public and permanent, so the last read and
	 * the submit button belong to the person whose report it is, on GitHub's page.
	 */
	function openIssue(): void {
		void bridge.call('system.openUrl', {
			url: toIssueUrl(REPO_URL, answer, appInfo?.version ?? '')
		});
	}

	/**
	 * Hands the same request to Claude Code in its own terminal.
	 *
	 * For when the answer needs a conversation rather than one reply — Claude Code can read
	 * the repository on this machine, which the app's single round trip never gives it room
	 * to do. Only offered when the binary is actually there.
	 */
	function openInCli(): void {
		void bridge
			.call('assistant.openInCli', {
				prompt: buildPrompt(
					question,
					logStore.entries,
					languageName(),
					mode,
					appInfo?.version ?? ''
				)
			})
			.catch((cause: unknown) => {
				error = cause instanceof Error ? cause.message : String(cause);
			});
	}

	function saveAsScript(): void {
		void settingsStore.update({ ...settingsStore.settings, engineScript: answer.trim() });
		notify(settingsStore, 'success', t('assistant.patch.applied'));
	}

	async function ask(): Promise<void> {
		if (asking || question.trim() === '') return;
		asking = true;
		error = '';
		answer = '';
		try {
			const result = await bridge.call('assistant.ask', {
				prompt: buildPrompt(
					question,
					logStore.entries,
					languageName(),
					mode,
					appInfo?.version ?? ''
				)
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
	<div class="flex min-h-full flex-col gap-4 p-5">
		<!-- First on the page on purpose: most people arrive here after something failed, and
		     the written-down answer is faster than asking for it. Dismissible, because that
		     stops being true the second time you read it. -->
		{#if hintOpen}
			<Card class="border-primary/30 bg-primary/5">
				<CardContent class="flex flex-wrap items-center gap-3 py-3">
					<LifeBuoyIcon class="size-4 shrink-0 text-primary" />
					<p class="min-w-0 flex-1 text-xs text-muted-foreground">
						{t('assistant.troubleshooting.hint')}
					</p>
					<Button
						variant="outline"
						size="sm"
						class="h-8"
						disabled={!appInfo}
						onclick={() => bridge.call('system.openUrl', { url: appInfo!.troubleshootingUrl })}
					>
						<ExternalLinkIcon />
						{t('assistant.troubleshooting')}
					</Button>
					<button
						type="button"
						aria-label={t('assistant.dismiss')}
						onclick={() => (hintOpen = false)}
						class="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
					>
						<XIcon class="size-3.5" />
					</button>
				</CardContent>
			</Card>
		{/if}

		<p class="text-xs text-muted-foreground">{t('assistant.subtitle')}</p>

		<!-- An error, not a note: with no source the assistant cannot answer at all, and the
		     page below it is a form that will refuse every submission. -->
		{#if ready === false}
			<Card class="border-destructive/40 bg-destructive/5">
				<CardContent class="flex flex-wrap items-center gap-3 py-4">
					<TriangleAlertIcon class="size-4 shrink-0 text-destructive" />
					<p class="min-w-0 flex-1 text-sm text-destructive">{t('assistant.noSource')}</p>
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
				placeholder={mode === 'patch'
					? t('assistant.placeholder.patch')
					: mode === 'report'
						? t('assistant.placeholder.report')
						: t('assistant.placeholder')}
				bind:value={question}
				disabled={asking || ready === false}
			/>
			<Button type="submit" size="sm" class="h-9" disabled={asking || question.trim() === ''}>
				<SendIcon class={cn(asking && 'animate-pulse')} />
				{asking ? t('assistant.asking') : t('assistant.ask')}
			</Button>
		</form>

		<!-- Radios, not toggles: the three are one choice about what this request is, and a row
		     of pressed buttons never said which one was in force. -->
		<fieldset class="flex flex-col gap-2">
			<legend class="sr-only">{t('assistant.mode')}</legend>
			<div class="flex flex-wrap items-center gap-x-4 gap-y-1.5">
				{#each MODES as option (option.value)}
					<label class="flex cursor-pointer items-center gap-1.5 text-[13px]">
						<input
							type="radio"
							name="assistant-mode"
							value={option.value}
							checked={mode === option.value}
							onchange={() => (mode = option.value)}
							class="size-3.5 accent-primary"
						/>
						<option.icon class="size-3.5 text-muted-foreground" />
						{t(option.label)}
					</label>
				{/each}
			</div>
			{#if mode !== 'question'}
				<p class="text-xs text-muted-foreground">
					{mode === 'patch' ? t('assistant.patch.hint') : t('assistant.report.hint')}
				</p>
			{/if}
		</fieldset>

		<!-- Pushed to the bottom edge: what leaves the machine is a footnote to the page, not a
		     step in the middle of it. -->
		<div class="mt-auto flex flex-wrap items-start justify-between gap-2 border-t pt-3">
			<p class="flex min-w-0 items-start gap-1.5 text-xs text-muted-foreground">
				<ShieldIcon class="mt-0.5 size-3.5 shrink-0" />
				{t('assistant.sendsLog')}
			</p>
			<Button
				variant="ghost"
				size="sm"
				class="h-7 shrink-0 text-xs"
				aria-expanded={previewOpen}
				onclick={() => (previewOpen = !previewOpen)}
			>
				{#if previewOpen}
					<EyeOffIcon />
					{t('assistant.preview.hide')}
				{:else}
					<EyeIcon />
					{t('assistant.preview.show')}
				{/if}
			</Button>
		</div>

		{#if previewOpen}
			<Card>
				<CardContent class="flex flex-col gap-3 py-4">
					<p class="text-xs text-muted-foreground">{t('assistant.preview.description')}</p>
					{#each preview as section (section.title)}
						<div class="flex flex-col gap-1">
							<h2 class="text-xs font-semibold tracking-tight">{section.title}</h2>
							<pre
								class="max-h-56 overflow-auto rounded-md bg-muted p-2.5 text-[11px] leading-relaxed whitespace-pre-wrap">{section.body}</pre>
						</div>
					{/each}
				</CardContent>
			</Card>
		{/if}

		{#if error}
			<p class="text-sm text-destructive">{error}</p>
		{/if}

		{#if answer}
			<Card>
				<CardContent class="py-4">
					<p class="text-sm whitespace-pre-wrap">{answer}</p>
					<div class="mt-3 flex flex-wrap gap-2">
						{#if sources?.local.found}
							<Button variant="outline" size="sm" class="h-8" onclick={openInCli}>
								<TerminalIcon />
								{t('assistant.openInCli')}
							</Button>
						{/if}
						{#if mode === 'patch'}
							<Button size="sm" class="h-8" onclick={saveAsScript}>
								<SaveIcon />
								{t('assistant.patch.apply')}
							</Button>
						{/if}
						{#if mode === 'report'}
							<Button size="sm" class="h-8" onclick={openIssue}>
								<ExternalLinkIcon />
								{t('assistant.report.open')}
							</Button>
						{/if}
						<Button
							variant="ghost"
							size="sm"
							class="h-8"
							onclick={() => {
								answer = '';
								error = '';
							}}
						>
							<Trash2Icon />
							{t('assistant.clear')}
						</Button>
					</div>
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
