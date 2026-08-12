<script lang="ts">
	import type { Component } from 'svelte';
	import type { Platform } from '$lib/engine/protocol';
	import { X_GROUPS, YOUTUBE_GROUPS, type ActionGroupDef } from '$lib/actions';
	import ActionRow from '$lib/components/action-row.svelte';
	import { ConfirmDialog } from '$lib/components/ui/alert-dialog';
	import XIcon from '$lib/components/icons/x-icon.svelte';
	import YoutubeIcon from '$lib/components/icons/youtube-icon.svelte';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import InfoIcon from '@lucide/svelte/icons/info';
	import XCloseIcon from '@lucide/svelte/icons/x';
	import { t } from '$lib/i18n/index.svelte';
	import { browser } from '../browser';
	import {
		ALL_ACTIONS,
		DEFAULT_SETTINGS,
		IDLE,
		LOG_LIMIT,
		SETTINGS_KEY,
		type Action,
		type BackgroundMessage,
		type PopupSettings,
		type RunState,
		type Snapshot,
		type Timeouts
	} from '../protocol';

	const PLATFORMS: { id: Platform; label: string; icon: Component; groups: ActionGroupDef[] }[] = [
		{ id: 'x', label: 'X', icon: XIcon, groups: X_GROUPS },
		{ id: 'youtube', label: 'YouTube', icon: YoutubeIcon, groups: YOUTUBE_GROUPS }
	];

	// Not `state`: Svelte reads `$state` in this file as the store value of a variable by that
	// name, and the rune stops resolving.
	let run = $state<RunState>(IDLE);
	let lines = $state<string[]>([]);
	let confirmTarget = $state<{ platform: Platform; group?: ActionGroupDef } | null>(null);
	let confirmOpen = $state(false);
	let settings = $state<PopupSettings>(DEFAULT_SETTINGS);
	let settingsOpen = $state(false);

	const busy = $derived(run.status === 'preparing' || run.status === 'running');
	const visible = $derived(PLATFORMS.filter((p) => settings.shown[p.id]));
	// Hiding both leaves an empty window with a gear in the corner. Showing the panel instead
	// puts the way back in front of the person who has to find it.
	const panelOpen = $derived(settingsOpen || visible.length === 0);

	void browser.storage.local.get(SETTINGS_KEY).then((stored) => {
		settings = (stored[SETTINGS_KEY] as PopupSettings | undefined) ?? DEFAULT_SETTINGS;
	});

	function save(next: PopupSettings): void {
		settings = next;
		void browser.storage.local.set({ [SETTINGS_KEY]: next });
	}

	function toggle(id: Platform): void {
		save({ ...settings, shown: { ...settings.shown, [id]: !settings.shown[id] } });
	}

	/** The same three the app exposes, under the same labels. */
	const TIMEOUT_FIELDS = [
		{ key: 'waitAfterDocumentLoad', label: 'settings.timing.afterLoad' },
		{ key: 'waitAfterDelete', label: 'settings.timing.betweenDeletes' },
		{ key: 'waitBetweenRetryDeleteAttempts', label: 'settings.timing.betweenRetries' }
	] as const;

	function setTimeout_(key: keyof Timeouts, value: string): void {
		const ms = Number(value);
		if (!Number.isFinite(ms) || ms < 0) return;
		save({ ...settings, timeouts: { ...settings.timeouts, [key]: Math.round(ms) } });
	}

	// Chrome closes this window as soon as focus leaves it, so nothing here is state — it is a
	// view of what the worker holds, fetched again on every open.
	void browser.runtime.sendMessage<Snapshot>({ kind: 'getState' }).then((snapshot) => {
		run = snapshot.state;
		lines = snapshot.lines;
	});

	// A content script's `sendMessage` reaches every extension context, this popup included, so
	// its raw reports arrive here alongside the worker's. Matched on `kind` rather than fallen
	// through to, or one renders as the string "[object Object]".
	browser.runtime.onMessage.addListener((message: BackgroundMessage) => {
		if (message.kind === 'state') run = message.state;
		// The worker's own limit, so a live line and a reopened popup show the same list.
		else if (message.kind === 'log' && message.level !== 'debug')
			lines = [...lines, message.message].slice(-LOG_LIMIT);
	});

	/** Show and delete share a target: deleting always happens on the page that lists the items. */
	function actionOf(group: ActionGroupDef): Action {
		return group.deleteAction as Action;
	}

	function platformLabel(id: Platform): string {
		return PLATFORMS.find((p) => p.id === id)?.label ?? id;
	}

	function groupsOf(id: Platform): ActionGroupDef[] {
		return PLATFORMS.find((p) => p.id === id)?.groups ?? [];
	}

	function isCurrent(platform: Platform, group: ActionGroupDef): boolean {
		return run.platform === platform && run.action === actionOf(group);
	}

	function show(platform: Platform, group: ActionGroupDef): void {
		void browser.runtime.sendMessage({ kind: 'show', platform, action: actionOf(group) });
	}

	function start(platform: Platform, actions: Action[]): void {
		lines = [];
		void browser.runtime.sendMessage({ kind: 'start', platform, actions });
	}

	function stop(): void {
		void browser.runtime.sendMessage({ kind: 'stop' });
	}

	function ask(platform: Platform, group?: ActionGroupDef): void {
		confirmTarget = { platform, group };
		confirmOpen = true;
	}

	function onConfirm(): void {
		confirmOpen = false;
		if (!confirmTarget) return;
		const { platform, group } = confirmTarget;
		start(platform, group ? [actionOf(group)] : ALL_ACTIONS[platform]);
	}
</script>

<!-- One width, whichever platforms are shown: a popup that resizes as a checkbox is ticked
     moves the controls under the pointer that just ticked it. -->
<div class="flex w-[520px] flex-col bg-background text-foreground">
	<header class="flex h-11 shrink-0 items-center gap-2 border-b px-3">
		<!-- The extension's own icon, from the package root next to popup.html. -->
		<img src="icons/32x32.png" alt="" width="16" height="16" class="size-4 shrink-0" />
		<span class="flex-1 text-[13px] font-semibold tracking-tight">CleanMyPosts</span>
		{#if run.status !== 'idle'}
			<span class="text-xs text-muted-foreground tabular-nums">
				{run.totalCount + run.deletedCount}
				{#if busy && run.queue.length}· +{run.queue.length}{/if}
			</span>
		{/if}
		{#if busy}
			<button
				type="button"
				onclick={stop}
				class="cursor-pointer rounded-md bg-destructive px-2 py-1 text-xs text-white"
			>
				{t('run.stop')}
			</button>
		{/if}
		<button
			type="button"
			aria-label={t('nav.settings')}
			aria-expanded={panelOpen}
			onclick={() => (settingsOpen = !settingsOpen)}
			class="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md transition-colors
			       duration-150 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none
			       {panelOpen ? 'bg-muted text-foreground' : 'text-muted-foreground'}"
		>
			<SettingsIcon class="size-3.5" />
		</button>
	</header>

	{#if panelOpen}
		<div class="flex flex-col gap-2 border-b bg-muted/40 px-3 py-2">
			<div class="flex items-center gap-4">
				{#each PLATFORMS as platform (platform.id)}
					{@const Icon = platform.icon}
					<label class="flex cursor-pointer items-center gap-1.5 text-xs">
						<input
							type="checkbox"
							checked={settings.shown[platform.id]}
							onchange={() => toggle(platform.id)}
							class="size-3.5 cursor-pointer accent-primary"
						/>
						<Icon class={platform.id === 'youtube' ? 'size-3.5 text-red-600' : 'size-3.5'} />
						{platform.label}
					</label>
				{/each}
			</div>

			<!-- Raising these is what a platform that started refusing needs. Lowering them is what
			     gets a session flagged, which is why they are named rather than tuned away. -->
			<div class="flex flex-col gap-1 border-t pt-2">
				{#each TIMEOUT_FIELDS as field (field.key)}
					<label class="flex items-center gap-2 text-xs">
						<span class="flex-1 text-muted-foreground">{t(field.label)}</span>
						<input
							type="number"
							min="0"
							step="100"
							value={settings.timeouts[field.key]}
							onchange={(e) => setTimeout_(field.key, e.currentTarget.value)}
							class="h-6 w-20 rounded-md border border-input bg-background px-1.5 text-right
							       tabular-nums focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
						/>
						<span class="w-4 text-[10px] text-muted-foreground">ms</span>
					</label>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Shown once. The two things a first run has to know are which half of a row does what,
	     and that the other half is final — neither is guessable from a list of nouns. The app
	     says these in a sidebar that is always there; a popup has one chance. -->
	{#if !settings.welcomed}
		<div class="flex gap-2 border-b bg-primary/5 px-3 py-2.5">
			<InfoIcon class="mt-0.5 size-3.5 shrink-0 text-primary" />
			<div class="flex-1 text-[11px] leading-relaxed">
				<p class="font-medium">{t('app.tagline')}</p>
				<p class="mt-1 text-muted-foreground">
					Click a row to open that list on the platform. The bin beside it empties the list, item by
					item, in the tab in front of you.
				</p>
				<p class="mt-1 text-muted-foreground">
					Deletion cannot be undone, and runs are deliberately slow — the pauses are what keep the
					session from being read as a bot.
				</p>
			</div>
			<button
				type="button"
				aria-label={t('confirm.cancel')}
				onclick={() => save({ ...settings, welcomed: true })}
				class="size-5 shrink-0 cursor-pointer rounded text-muted-foreground hover:bg-muted hover:text-foreground"
			>
				<XCloseIcon class="size-3.5" />
			</button>
		</div>
	{/if}

	<!-- Two columns rather than one list: the platforms have nothing to do with each other, and
	     stacking them made a popup twice as tall as it needed to be for seven rows. -->
	<div class="grid divide-x {visible.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}">
		{#each visible as platform (platform.id)}
			{@const Icon = platform.icon}
			<section class="flex flex-col gap-0.5 p-1.5">
				<h2
					class="flex items-center gap-1.5 px-2 pt-1 pb-1.5 text-[11px] font-medium tracking-tight text-muted-foreground"
				>
					<Icon class={platform.id === 'youtube' ? 'size-3.5 text-red-600' : 'size-3.5'} />
					{platform.label}
				</h2>

				{#each platform.groups as group (group.key)}
					<ActionRow
						label={group.label}
						icon={group.icon}
						disabled={busy}
						active={busy && isCurrent(platform.id, group)}
						current={!busy && isCurrent(platform.id, group)}
						onShow={() => show(platform.id, group)}
						onDelete={() => ask(platform.id, group)}
					/>
				{/each}

				<!-- Pinned to the bottom of its column so both sit on one line despite X having
				     five lists and YouTube two. No show button: "everything" is not a page. -->
				<button
					type="button"
					disabled={busy}
					onclick={() => ask(platform.id)}
					class="group/all mt-auto flex h-8 cursor-pointer items-center gap-2 rounded-md ps-2 pe-2 text-start
					       transition-colors duration-150 hover:bg-destructive/10 focus-visible:ring-2
					       focus-visible:ring-ring focus-visible:outline-none disabled:pointer-events-none
					       disabled:opacity-40"
				>
					<Trash2Icon
						class="size-3.5 shrink-0 text-muted-foreground group-hover/all:text-destructive"
					/>
					<span class="flex-1 truncate text-[13px] group-hover/all:text-destructive">
						{t('action.deleteAll')}
					</span>
				</button>
			</section>
		{/each}
	</div>

	{#if run.message || lines.length}
		<div class="border-t px-1.5 py-1.5">
			{#if run.message}
				<p class="px-2 pb-1 text-xs text-destructive">{run.message}</p>
			{/if}
			{#if lines.length}
				<pre
					class="max-h-24 overflow-auto rounded-md bg-muted p-2 text-[10px] leading-tight">{lines.join(
						'\n'
					)}</pre>
			{/if}
		</div>
	{/if}
</div>

{#if confirmTarget}
	<ConfirmDialog
		bind:open={confirmOpen}
		title={confirmTarget.group
			? t('confirm.title', { plural: t(confirmTarget.group.plural) })
			: t('confirm.all.title', { platform: platformLabel(confirmTarget.platform) })}
		description={confirmTarget.group
			? t('confirm.description', {
					plural: t(confirmTarget.group.plural),
					platform: platformLabel(confirmTarget.platform)
				})
			: t('confirm.all.description', {
					platform: platformLabel(confirmTarget.platform),
					lists: groupsOf(confirmTarget.platform)
						.map((group) => t(group.plural))
						.join(', ')
				})}
		confirmLabel={t('confirm.confirm')}
		cancelLabel={t('confirm.cancel')}
		{onConfirm}
		onCancel={() => (confirmOpen = false)}
	/>
{/if}
