<script lang="ts">
	import type { Component, Snippet } from 'svelte';

	interface Props {
		title: string;
		icon: Component;
		children: Snippet;
	}

	let { title, icon: Icon, children }: Props = $props();
</script>

<section class="rounded-lg border border-border/60 bg-card/50">
	<h2
		class="flex items-center gap-2 border-b px-4 py-2.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
	>
		<Icon class="size-3.5" />
		{title}
	</h2>
	<div class="divide-y divide-border/60 px-4 py-1">
		{@render children()}
	</div>
</section>
