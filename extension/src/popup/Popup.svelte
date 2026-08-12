<script lang="ts">
	import type { Platform } from '$lib/engine/protocol';
	import { browser } from '../browser';
	import { IDLE, type Action, type BackgroundMessage, type RunState } from '../protocol';

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

	const busy = $derived(run.status === 'preparing' || run.status === 'running');

	void browser.runtime.sendMessage<RunState>({ kind: 'getState' }).then((s) => (run = s));

	// A content script's `sendMessage` reaches every extension context, this popup included, so
	// its raw reports arrive here alongside the worker's. Matched on `kind` rather than fallen
	// through to, or one renders as the string "[object Object]".
	browser.runtime.onMessage.addListener((message: BackgroundMessage) => {
		if (message.kind === 'state') run = message.state;
		// Trimmed on the way in: the popup is 400px tall and a run logs for as long as it deletes.
		else if (message.kind === 'log' && message.level !== 'debug')
			lines = [...lines, message.message].slice(-40);
	});

	function start(platform: Platform, action: Action): void {
		lines = [];
		void browser.runtime.sendMessage({ kind: 'start', platform, action });
	}

	function stop(): void {
		void browser.runtime.sendMessage({ kind: 'stop' });
	}
</script>

<div class="flex w-[340px] flex-col gap-3 bg-background p-4 text-foreground">
	<header class="flex items-baseline justify-between">
		<h1 class="text-sm font-semibold">CleanMyPosts</h1>
		<span class="text-xs text-muted-foreground">
			{run.status === 'idle' ? '' : `${run.deletedCount} removed`}
		</span>
	</header>

	{#each ['x', 'youtube'] as const as platform (platform)}
		<section class="flex flex-col gap-1">
			<h2 class="text-xs tracking-wide text-muted-foreground uppercase">
				{platform === 'x' ? 'X' : 'YouTube'}
			</h2>
			<div class="flex flex-wrap gap-1">
				{#each CHOICES.filter((c) => c.platform === platform) as choice (choice.action)}
					<button
						class="rounded-md border border-input px-2 py-1 text-xs hover:bg-accent disabled:opacity-50"
						disabled={busy}
						onclick={() => start(choice.platform, choice.action)}
					>
						{choice.label}
					</button>
				{/each}
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
