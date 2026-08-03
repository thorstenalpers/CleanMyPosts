<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { page } from '$app/state';
	import { goto, preloadCode } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { ModeWatcher, setMode } from 'mode-watcher';
	import { createBridgeClient } from '$lib/bridge/client';
	import { createTauriHost, isTauri } from '$lib/bridge/tauri-host';
	import { createMockHost, defaultMockHandlers } from '$lib/bridge/mock';
	import type { AppTheme, Platform } from '$lib/bridge/contract';
	import { SettingsStore } from '$lib/stores/settings.svelte';
	import { LogStore } from '$lib/stores/log.svelte';
	import { SiteLoginStore } from '$lib/stores/site-login.svelte';
	import { ActionRunner } from '$lib/stores/action-runner.svelte';
	import { setAppContext } from '$lib/app-context';
	import { Toaster } from '$lib/components/ui/sonner';
	import SidebarShell, { type NavItem } from '$lib/components/sidebar-shell.svelte';
	import RunStatus from '$lib/components/run-status.svelte';
	import XView from '$lib/views/x-view.svelte';
	import YouTubeView from '$lib/views/youtube-view.svelte';
	import { ACTION_RAIL_WIDTH, SIDEBAR_COLLAPSED_WIDTH, SIDEBAR_EXPANDED_WIDTH } from '$lib/layout';
	import { applyPreset, applyThemeChange } from '$lib/theme/preset';
	import { i18n, t } from '$lib/i18n/index.svelte';
	import { cn } from '$lib/utils';
	import XIcon from '$lib/components/icons/x-icon.svelte';
	import YouTubeIcon from '$lib/components/icons/youtube-icon.svelte';
	import HouseIcon from '@lucide/svelte/icons/house';
	import ScrollTextIcon from '@lucide/svelte/icons/scroll-text';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import '../app.css';

	/**
	 * The local app, shown in the chrome webview (column 0): the sidebar, the action rail
	 * that slides in beside it for X/YouTube, and the Overview/Settings/Log pages in the
	 * content area. Each platform has its own site webview in column 1, both loaded for the
	 * whole session; `site.show` / `site.hide` decide which one is on screen and
	 * `layout.setChromeWidth` tells the host how much room column 0 needs.
	 */

	interface Props {
		children: Snippet;
	}

	let { children }: Props = $props();

	// `vite dev` in a plain browser has no host — fall back to an in-memory mock so the UI is still previewable.
	const bridge = isTauri()
		? createBridgeClient(createTauriHost())
		: createMockHost(defaultMockHandlers()).client;

	const settingsStore = new SettingsStore(bridge);
	const logStore = new LogStore(bridge);
	const loginStore = new SiteLoginStore(bridge);
	// One runner for the whole app: a deletion keeps reporting progress in the sidebar
	// even after the user navigates away from the rail that started it.
	const runner = new ActionRunner(bridge);

	type NavKey = 'overview' | 'x' | 'youtube' | 'log' | 'settings';

	// The overview sits at `/`: `/` is the file the webview opens, and it has to be the
	// prerendered shell, not a redirect that waits for the router.
	const ROUTES = {
		overview: '/',
		x: '/x',
		youtube: '/youtube',
		log: '/log',
		settings: '/settings'
	} as const;

	const activeKey = $derived((page.url.pathname.split('/')[1] || 'overview') as NavKey);
	let sidebarExpanded = $state(true);

	let panelOpen = $state(false);
	let shell = $state<HTMLElement | undefined>(undefined);

	function onNavigate(key: NavKey): void {
		const platform = key === 'x' || key === 'youtube' ? key : undefined;
		// One item, two states: the first click opens the actions, the next one closes them.
		panelOpen = !!platform && !(panelOpen && activeKey === key);
		void goto(resolve(ROUTES[key]));
	}

	setAppContext({
		bridge,
		settingsStore,
		logStore,
		loginStore,
		runner,
		openPlatform: (platform: Platform) => void goto(resolve(ROUTES[platform]))
	});

	onMount(async () => {
		await Promise.all([settingsStore.load(), logStore.load()]);
		// Every route is a prerendered file sitting next to this one, so pulling their modules
		// in once the overview is up costs a few idle milliseconds and buys an instant first
		// click on every other page. Deliberately after the stores: the visible page settles
		// before anything is fetched for a page nobody has asked for yet.
		await Promise.all(Object.values(ROUTES).map((path) => preloadCode(resolve(path))));
	});

	// Only on an actual change: `applyThemeChange` suppresses transitions for a moment, and
	// this effect also wakes up for settings that have nothing to do with the theme.
	let appliedTheme: AppTheme | undefined;

	// The language is a plain assignment rather than a store read at every call site: `t`
	// reads `i18n.locale`, so one write here re-renders every string in the app.
	$effect(() => {
		i18n.setting = settingsStore.settings.language;
	});

	$effect(() => {
		const { theme, themePreset } = settingsStore.settings;
		// Deferred: setMode writes mode-watcher's own state, and Svelte 5 rejects a state
		// write that happens while effects are still flushing.
		queueMicrotask(() => {
			if (appliedTheme !== theme) {
				appliedTheme = theme;
				applyThemeChange(() =>
					setMode(theme === 'Light' ? 'light' : theme === 'Dark' ? 'dark' : 'system')
				);
			}
			applyPreset(themePreset);
			reportBackground();
		});
	});

	/**
	 * Hands the host the colour the shell paints.
	 *
	 * Resizing a webview exposes pixels the page has not drawn into yet, and WebView2 fills
	 * those with black until the page catches up — that is the band that flashes above the
	 * action panel as it opens. Read off the shell rather than hard-coded, so it follows the
	 * mode and the preset without a second source of truth.
	 */
	function reportBackground(): void {
		if (!shell) return;
		// Rasterised rather than parsed: the computed value is `oklch(…)`, and so is what
		// canvas reports back from `fillStyle`. Reading a pixel is the only thing that forces
		// the browser to resolve it to sRGB bytes — pulling the numbers out of the string
		// would have handed the host `#010000` for white.
		const canvas = document.createElement('canvas');
		canvas.width = 1;
		canvas.height = 1;
		const context = canvas.getContext('2d', { willReadFrequently: true });
		if (!context) return;
		context.fillStyle = getComputedStyle(shell).backgroundColor;
		context.fillRect(0, 0, 1, 1);
		const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
		const hex = [red, green, blue]
			.map((channel) => (channel ?? 0).toString(16).padStart(2, '0'))
			.join('');
		void bridge.call('layout.setBackground', { color: `#${hex}` });
	}

	const navItems = $derived([
		{ key: 'overview' as const, label: t('nav.overview'), icon: HouseIcon },
		...(settingsStore.settings.showX
			? [
					{
						key: 'x' as const,
						label: 'X',
						icon: XIcon,
						// The X mark is black on light and white on dark — which is `foreground`.
						iconClass: 'text-foreground',
						status: loginStore.loggedIn.x ? ('connected' as const) : ('disconnected' as const)
					}
				]
			: []),
		...(settingsStore.settings.showYouTube
			? [
					{
						key: 'youtube' as const,
						label: 'YouTube',
						icon: YouTubeIcon,
						iconClass: 'cmp-brand-youtube',
						status: loginStore.loggedIn.youtube ? ('connected' as const) : ('disconnected' as const)
					}
				]
			: []),
		...(settingsStore.settings.showLogs
			? [{ key: 'log' as const, label: t('nav.log'), icon: ScrollTextIcon }]
			: []),
		{ key: 'settings' as const, label: t('nav.settings'), icon: SettingsIcon, footer: true }
	] satisfies NavItem<NavKey>[]);

	/** How long the local page gets to fade out before the site webview takes the stage. */
	const HAND_OFF_MS = 140;

	const railPlatform = $derived(
		activeKey === 'x' || activeKey === 'youtube' ? activeKey : undefined
	);
	const panelVisible = $derived(!!railPlatform && panelOpen);

	// Hiding a page in the settings has to close the one you are standing on, and the same
	// guard catches a URL that names a route the sidebar does not offer.
	const reachable = $derived(new Set<string>(navItems.map((item) => item.key)));

	$effect(() => {
		if (!reachable.has(activeKey)) void goto(resolve(ROUTES.overview));
	});

	// Leaving a platform takes its actions with it.
	$effect(() => {
		if (!railPlatform) panelOpen = false;
	});

	// The rail pushes the site aside, so the site column starts where the chrome ends.
	$effect(() => {
		const sidebar = sidebarExpanded ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH;
		void bridge.call('layout.setChromeWidth', {
			width: sidebar + (panelVisible ? ACTION_RAIL_WIDTH : 0)
		});
	});

	// Derived from the route, not from the click that caused it: this also has to be right
	// on start-up and after a back/forward. `site.show` moves the platform's webview into
	// view and nothing else — navigating it here is what used to throw the page away.
	//
	// The delay is the whole trick behind the hand-off. The chrome page and the site webview
	// are repainted by different engines, so showing the site the instant the route changes
	// put the outgoing page and the incoming site on screen together for a frame or two.
	// Letting the page fade out first and only then calling the host turns that collision
	// into a sequence, which is what makes it read as one window rather than two.
	$effect(() => {
		const platform = railPlatform;
		if (!platform) {
			void bridge.call('site.hide', { hide: true });
			return;
		}
		const timer = setTimeout(() => void bridge.call('site.show', { platform }), HAND_OFF_MS);
		return () => clearTimeout(timer);
	});
</script>

<!-- mode-watcher's own transition suppressor is a `* { transition: none !important }` style
     it removes on the next animation frame. This app parks its webview off-screen, where
     frames stop coming, so that rule can survive and kill every transition in the app.
     `applyThemeChange` does the same job with a timer that always fires. -->
<ModeWatcher disableTransitions={false} />
<Toaster />

<svelte:window
	onkeydown={(event: KeyboardEvent) => {
		if (event.key === 'Escape') panelOpen = false;
	}}
/>

<div bind:this={shell} class="flex h-screen bg-background">
	<SidebarShell {navItems} {activeKey} {onNavigate} bind:expanded={sidebarExpanded}>
		{#snippet status()}
			{#if runner.running && runner.currentLabel}
				<RunStatus
					label={runner.currentLabel}
					deletedCount={runner.deletedSoFar}
					onStop={() => runner.cancel()}
				/>
			{/if}
		{/snippet}
	</SidebarShell>

	{#if railPlatform === 'x'}
		<XView
			{bridge}
			{settingsStore}
			{loginStore}
			{runner}
			open={panelVisible}
			onClose={() => (panelOpen = false)}
		/>
	{:else if railPlatform === 'youtube'}
		<YouTubeView
			{bridge}
			{settingsStore}
			{loginStore}
			{runner}
			open={panelVisible}
			onClose={() => (panelOpen = false)}
		/>
	{/if}

	<!-- Fades out before the host swaps in the site webview, and back in on the way home. -->
	<main
		class={cn(
			'relative min-w-0 flex-1 overflow-hidden transition-opacity duration-150 ease-out',
			railPlatform ? 'pointer-events-none opacity-0' : 'opacity-100'
		)}
	>
		{@render children()}
	</main>
</div>
