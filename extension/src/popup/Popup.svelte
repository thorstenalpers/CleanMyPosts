<script lang="ts">
	import type { Component } from 'svelte';
	import type { Platform } from '$lib/engine/protocol';
	import { X_GROUPS, YOUTUBE_GROUPS, type ActionGroupDef } from '$lib/actions';
	import ActionRow from '$lib/components/action-row.svelte';
	import { ConfirmDialog } from '$lib/components/ui/alert-dialog';
	import XIcon from '$lib/components/icons/x-icon.svelte';
	import YoutubeIcon from '$lib/components/icons/youtube-icon.svelte';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import { t } from '$lib/i18n/index.svelte';
	import { browser } from '../browser';
	import {
		ALL_ACTIONS,
		IDLE,
		LOG_LIMIT,
		type Action,
		type BackgroundMessage,
		type RunState,
		type Snapshot
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

	const busy = $derived(run.status === 'preparing' || run.status === 'running');

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

<div class="flex w-[520px] flex-col bg-background text-foreground">
	<header class="flex h-11 shrink-0 items-center gap-2 border-b px-3">
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
	</header>

	<!-- Two columns rather than one list: the platforms have nothing to do with each other, and
	     stacking them made a popup twice as tall as it needed to be for seven rows. -->
	<div class="grid grid-cols-2 divide-x">
		{#each PLATFORMS as platform (platform.id)}
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
