<script lang="ts">
	import type { Platform } from '$lib/engine/protocol';
	import XIcon from '$lib/components/icons/x-icon.svelte';
	import YoutubeIcon from '$lib/components/icons/youtube-icon.svelte';
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

	const CHOICES: { platform: Platform; action: Action; label: string }[] = [
		{ platform: 'x', action: 'deletePosts', label: 'Posts' },
		{ platform: 'x', action: 'deleteReplies', label: 'Replies' },
		{ platform: 'x', action: 'deleteReposts', label: 'Reposts' },
		{ platform: 'x', action: 'deleteLikes', label: 'Likes' },
		{ platform: 'x', action: 'deleteFollowing', label: 'Following' },
		{ platform: 'youtube', action: 'deleteComments', label: 'Comments' },
		{ platform: 'youtube', action: 'deleteLikes', label: 'Liked videos' }
	];

	// Not `state`: Svelte reads `$state` in this file as the store value of a variable by that
	// name, and the rune stops resolving.
	let run = $state<RunState>(IDLE);
	let lines = $state<string[]>([]);
	/** Which platform's "everything" is one more click from happening. */
	let arming = $state<Platform | null>(null);

	const busy = $derived(run.status === 'preparing' || run.status === 'running');
	const label = $derived(
		CHOICES.find((c) => c.platform === run.platform && c.action === run.action)?.label ?? ''
	);

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

	function start(platform: Platform, actions: Action[]): void {
		lines = [];
		arming = null;
		void browser.runtime.sendMessage({ kind: 'start', platform, actions });
	}

	/**
	 * Two clicks for "everything", one for a single list.
	 *
	 * It sits next to six buttons that empty one list each and empties all of them, and none of
	 * it comes back. A misclick there is not a misclick anybody can undo.
	 */
	function deleteAll(platform: Platform): void {
		if (arming !== platform) {
			arming = platform;
			return;
		}
		start(platform, ALL_ACTIONS[platform]);
	}

	function stop(): void {
		void browser.runtime.sendMessage({ kind: 'stop' });
	}
</script>

<div class="flex w-[340px] flex-col gap-3 bg-background p-4 text-foreground">
	<header class="flex items-baseline justify-between">
		<h1 class="text-sm font-semibold">CleanMyPosts</h1>
		<span class="text-xs text-muted-foreground">
			{#if run.status !== 'idle'}
				{run.totalCount + run.deletedCount} removed
				{#if busy && label}
					· {label}{run.queue.length ? ` (+${run.queue.length})` : ''}
				{/if}
			{/if}
		</span>
	</header>

	{#each ['x', 'youtube'] as const as platform (platform)}
		<section class="flex flex-col gap-1">
			<h2 class="flex items-center gap-1.5 text-xs tracking-wide text-muted-foreground uppercase">
				{#if platform === 'x'}
					<XIcon class="size-3.5" />
				{:else}
					<YoutubeIcon class="size-3.5 text-red-600" />
				{/if}
				{platform === 'x' ? 'X' : 'YouTube'}
			</h2>
			<div class="flex flex-wrap gap-1">
				{#each CHOICES.filter((c) => c.platform === platform) as choice (choice.action)}
					<button
						class="rounded-md border border-input px-2 py-1 text-xs hover:bg-accent disabled:opacity-50"
						disabled={busy}
						onclick={() => start(choice.platform, [choice.action])}
					>
						{choice.label}
					</button>
				{/each}
				<button
					class="rounded-md border px-2 py-1 text-xs disabled:opacity-50 {arming === platform
						? 'border-destructive bg-destructive font-medium text-white'
						: 'border-destructive/40 text-destructive hover:bg-destructive/10'}"
					disabled={busy}
					onclick={() => deleteAll(platform)}
					onblur={() => (arming = arming === platform ? null : arming)}
				>
					{arming === platform
						? `Delete all ${ALL_ACTIONS[platform].length}? Click again`
						: 'Delete all'}
				</button>
			</div>
		</section>
	{/each}

	{#if busy}
		<button class="rounded-md bg-destructive px-2 py-1 text-xs text-white" onclick={stop}>
			Stop
		</button>
	{/if}

	{#if run.message}
		<p class="text-xs text-destructive">{run.message}</p>
	{/if}

	{#if lines.length}
		<pre
			class="max-h-40 overflow-auto rounded-md bg-muted p-2 text-[10px] leading-tight">{lines.join(
				'\n'
			)}</pre>
	{/if}

	<p class="text-[10px] text-muted-foreground">
		Deletion cannot be undone. Runs are deliberately slow.
	</p>
</div>
