<script lang="ts">
	import { onMount } from 'svelte';
	import { t } from '$lib/i18n/index.svelte';

	interface Props {
		/** The floor, not the duration. Kept as a prop so a test does not have to wait it out. */
		minimumMs?: number;
	}

	let { minimumMs = 2000 }: Props = $props();

	/** In step with `duration-500` below. */
	const FADE_MS = 500;

	let leaving = $state(false);
	let gone = $state(false);

	// The timer starts at mount, so a slow start pushes the splash out rather than cutting it
	// short: whatever the app spends getting ready happens before this begins to count.
	//
	// Removed on a second timer rather than on `transitionend`, which is the trap the layout
	// already documents for mode-watcher: this app parks its webview where frames stop coming,
	// and a transition that never runs never ends — the splash would stay in the DOM forever,
	// invisible and swallowing nothing but still there.
	onMount(() => {
		let fade: ReturnType<typeof setTimeout>;
		const timer = setTimeout(() => {
			leaving = true;
			fade = setTimeout(() => (gone = true), FADE_MS);
		}, minimumMs);
		return () => {
			clearTimeout(timer);
			clearTimeout(fade);
		};
	});
</script>

<!-- Rendered by the prerendered layout, so it is inside the HTML the webview opens rather
     than something JavaScript has to put there — which is the difference between a splash
     that covers the start and one nobody ever sees. -->
{#if !gone}
	<div
		class="fixed inset-0 z-100 flex flex-col items-center justify-center gap-6 bg-background transition-opacity duration-500 ease-out"
		class:opacity-0={leaving}
		class:pointer-events-none={leaving}
		aria-hidden={leaving}
		role="status"
		aria-live="polite"
	>
		<img src="/favicon.png" alt="" width="72" height="72" class="mark size-18 rounded-2xl" />

		<div class="flex flex-col items-center gap-1">
			<p class="text-xl font-semibold tracking-tight">CleanMyPosts</p>
			<p class="text-sm text-muted-foreground">{t('app.tagline')}</p>
		</div>

		<div class="h-0.5 w-40 overflow-hidden rounded-full bg-muted">
			<div class="sweep h-full w-1/3 rounded-full bg-foreground/60"></div>
		</div>
	</div>
{/if}

<style>
	/* Keyframes rather than a transition: these have to run before Svelte hydrates. */
	.mark {
		animation: rise 700ms cubic-bezier(0.16, 1, 0.3, 1) both;
	}

	.sweep {
		animation: sweep 1.4s ease-in-out infinite;
	}

	@keyframes rise {
		from {
			opacity: 0;
			transform: translateY(8px) scale(0.96);
		}
		to {
			opacity: 1;
			transform: none;
		}
	}

	@keyframes sweep {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(300%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.mark,
		.sweep {
			animation: none;
		}
	}
</style>
