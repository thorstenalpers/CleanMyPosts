<script lang="ts">
	import { onMount, untrack, type Snippet } from 'svelte';
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
	import { UpdaterStore } from '$lib/stores/updater.svelte';
	import { setAppContext } from '$lib/app-context';
	import { Toaster } from '$lib/components/ui/sonner';
	import SidebarShell, { type NavItem } from '$lib/components/sidebar-shell.svelte';
	import PageHeader from '$lib/components/page-header.svelte';
	import StatusBar from '$lib/components/status-bar.svelte';
	import BootSplash from '$lib/components/boot-splash.svelte';
	import XView from '$lib/views/x-view.svelte';
	import YouTubeView from '$lib/views/youtube-view.svelte';
	import AssistantPanel from '$lib/views/assistant-panel.svelte';
	import {
		ACTION_RAIL_WIDTH,
		HEADER_HEIGHT,
		STATUS_BAR_HEIGHT,
		SIDEBAR_COLLAPSED_WIDTH,
		SIDEBAR_EXPANDED_WIDTH,
		SIDEBAR_FOLD_WIDTH,
		PANEL_FOLD_WIDTH,
		ASSISTANT_PANEL_WIDTH
	} from '$lib/layout';
	import { applyPreset, applyThemeChange } from '$lib/theme/preset';
	import { i18n, t } from '$lib/i18n/index.svelte';
	import { cn } from '$lib/utils';
	import XIcon from '$lib/components/icons/x-icon.svelte';
	import YouTubeIcon from '$lib/components/icons/youtube-icon.svelte';
	import HouseIcon from '@lucide/svelte/icons/house';
	import ScrollTextIcon from '@lucide/svelte/icons/scroll-text';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	import InfoIcon from '@lucide/svelte/icons/info';
	import '../app.css';

	/**
	 * The local app, shown in the chrome webview (column 0): the sidebar, the action rail
	 * that slides in beside it for X/YouTube, and the Overview/Settings/Log pages in the
	 * content area. Each platform has its own site webview in column 1, both loaded for the
	 * whole session; `site.show` / `site.hide` decide which one is on screen and
	 * `layout.setSiteInset` tells the host where that column starts.
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
	const updater = new UpdaterStore(bridge);

	type NavKey = 'overview' | 'x' | 'youtube' | 'log' | 'assistant' | 'settings' | 'info';

	// The overview sits at `/`: `/` is the file the webview opens, and it has to be the
	// prerendered shell, not a redirect that waits for the router.
	const ROUTES = {
		overview: '/',
		x: '/x',
		youtube: '/youtube',
		log: '/log',
		assistant: '/assistant',
		settings: '/settings',
		info: '/info'
	} as const;

	const routeKey = $derived((page.url.pathname.split('/')[1] || 'overview') as NavKey);
	let sidebarExpanded = $state(true);

	// Zero until the browser reports one: the shell is prerendered, and a width that does not
	// exist yet is not a small window — folding on it would open the app half-collapsed.
	let windowWidth = $state(0);
	const sidebarTooNarrow = $derived(windowWidth > 0 && windowWidth < SIDEBAR_FOLD_WIDTH);
	const panelTooNarrow = $derived(windowWidth > 0 && windowWidth < PANEL_FOLD_WIDTH);

	// Set on the click, cleared when the router arrives. `goto` only resolves once the target
	// page's module is in, and on a cold start that module is still being fetched — waiting
	// for it before moving the highlight is what made the first click on each page feel like
	// the app had missed it.
	let pendingKey = $state<NavKey | undefined>(undefined);
	const activeKey = $derived(pendingKey ?? routeKey);

	$effect(() => {
		if (pendingKey === routeKey) pendingKey = undefined;
	});

	// The ✕ is the only thing that closes the actions, so it is the only thing that decides.
	// Tracking the user's intent rather than the panel's visibility means nothing else in the
	// app — a re-render, a push from the host, a route settling — can take the panel away
	// behind their back.
	// A dropdown in the header would otherwise open behind the platform's webview: the chrome
	// only owns the strip above it. Same move the confirm dialog makes.
	let headerMenuOpen = $state(false);

	// Same reason as the header menu: a modal in the chrome can only centre within the chrome,
	// so the platform has to stay off screen for as long as one is up. It belongs here rather
	// than in the panel because this component also shows the site on a timer after a route
	// change, and two callers deciding the same thing meant the later one won.
	let dialogOpen = $state(false);

	// The overview's shortcut only states an intent; the platform's own panel owns the
	// confirmation and the run, and clears this the moment it has taken it.
	let deleteAllFor = $state<Platform | undefined>(undefined);

	// Off until asked for. It is a column, and a column that opens by itself takes the platform
	// page's room without anybody having decided that.
	let assistantOpen = $state(false);
	// Folded away with the action panel, and for the same reason: below that width there is not
	// room for the site and a column beside it.
	const assistantVisible = $derived(assistantOpen && !panelTooNarrow);

	let panelClosedByUser = $state(false);
	let panelFoldedByWidth = $state(false);
	let shell = $state<HTMLElement | undefined>(undefined);

	// Folded by the window rather than by the user, and remembered as such: a deliberate toggle
	// while the window is small has to stand, and the state the user left the sidebar in has to
	// come back once there is room for it again. Read outside the effect's dependencies so it
	// only ever fires on the crossing — tracking `sidebarExpanded` here would undo every manual
	// click on the toggle for as long as the window stayed small.
	let sidebarFoldedByWidth = false;
	$effect(() => {
		const narrow = sidebarTooNarrow;
		untrack(() => {
			if (narrow) {
				sidebarFoldedByWidth = sidebarExpanded;
				sidebarExpanded = false;
			} else if (sidebarFoldedByWidth) {
				sidebarFoldedByWidth = false;
				sidebarExpanded = true;
			}
		});
	});

	// Its own flag rather than the user's: the ✕ still means "I do not want these", and a window
	// that grows back has no business overruling that. Untracked for the same reason as above —
	// the header's way back in must survive until the width crosses again.
	$effect(() => {
		const narrow = panelTooNarrow;
		untrack(() => (panelFoldedByWidth = narrow));
	});

	function onNavigate(key: NavKey): void {
		const platform = key === 'x' || key === 'youtube' ? key : undefined;
		// Opening only, never toggling: the actions are what a platform is for, and the panel
		// carries the running deletion and its result. Closing it is a deliberate click on its
		// own ✕, not something a second click on the same nav item does by accident.
		if (platform) panelClosedByUser = false;
		pendingKey = key;
		void goto(resolve(ROUTES[key]));
	}

	setAppContext({
		bridge,
		settingsStore,
		logStore,
		loginStore,
		runner,
		updater,
		openPlatform: (platform: Platform, options?: { deleteAll?: boolean }) => {
			// Same as clicking the platform in the sidebar: arriving without its actions leaves
			// the user on a page with nothing to do.
			panelClosedByUser = false;
			pendingKey = platform;
			// The panel is what answers the shortcut, so a window that folded it away has to give
			// it back — otherwise the click from the overview lands on nothing at all.
			if (options?.deleteAll) {
				panelFoldedByWidth = false;
				deleteAllFor = platform;
			}
			void goto(resolve(ROUTES[platform]));
		}
	});

	onMount(() => {
		// Nothing is awaited in sequence here. The stores and the route modules are fetched
		// side by side, and the shell stays usable while both are in flight: the sidebar
		// renders from the default settings, and a click on a page whose module has not landed
		// yet is taken and highlighted immediately, then served the moment it does.
		void settingsStore.load();
		void logStore.load();
		for (const path of Object.values(ROUTES)) void preloadCode(resolve(path));
	});

	// Waits for the real settings: the fallback has the check on, and asking GitHub for a
	// version on behalf of someone who switched that off would be exactly the request they
	// declined. Failures stay silent — starting without a network is ordinary.
	let startupCheckDone = false;
	$effect(() => {
		if (settingsStore.loading || startupCheckDone) return;
		startupCheckDone = true;
		if (settingsStore.settings.checkUpdatesOnStart) void updater.check().catch(() => {});
	});

	// Only on an actual change: `applyThemeChange` suppresses transitions for a moment, and
	// this effect also wakes up for settings that have nothing to do with the theme.
	let appliedTheme: AppTheme | undefined;

	// The language is a plain assignment rather than a store read at every call site: `t`
	// reads `i18n.locale`, so one write here re-renders every string in the app.
	$effect(() => {
		i18n.setting = settingsStore.settings.language;
		// `dir` on <html> is what mirrors the shell for Arabic; every layout rule that could
		// not stay direction-neutral is written as a logical property, so this one write is
		// the whole switch.
		i18n.applyToDocument();
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
						// The X mark takes the row's own colour: on a hovered or current row that
						// is white, and a mark pinned to `foreground` would go black on grey there.
						iconClass: 'text-current',
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
		...(settingsStore.settings.showAssistant
			? [
					{
						key: 'assistant' as const,
						label: t('nav.assistant'),
						icon: SparklesIcon
					}
				]
			: []),
		...(settingsStore.settings.showLogs
			? [
					{
						key: 'log' as const,
						label: t('nav.log'),
						icon: ScrollTextIcon
					}
				]
			: []),
		// Info above Settings: the way out of the app sits at the very bottom.
		{ key: 'info' as const, label: t('nav.info'), icon: InfoIcon, footer: true },
		{ key: 'settings' as const, label: t('nav.settings'), icon: SettingsIcon, footer: true }
	] satisfies NavItem<NavKey>[]);

	// The bar over every page: which page it is, and where that is. `activeKey` rather than the
	// route, so it moves with the click instead of with the module that answers it.
	const current = $derived(
		navItems.find((item) => item.key === activeKey) ?? { label: t('nav.overview'), icon: HouseIcon }
	);

	/** How long the local page gets to fade out before the site webview takes the stage. */
	const HAND_OFF_MS = 140;

	const railPlatform = $derived(
		activeKey === 'x' || activeKey === 'youtube' ? activeKey : undefined
	);
	// Open whenever a platform is up, unless the user closed it themselves. Derived rather
	// than stored, so nothing else in the app can flip it in passing.
	const panelVisible = $derived(!!railPlatform && !panelClosedByUser && !panelFoldedByWidth);

	/** For the app's own pages that is the route; for a platform it is the page's real address. */
	const location = $derived(
		railPlatform ? (loginStore.url[railPlatform] ?? ROUTES[railPlatform]) : ROUTES[activeKey]
	);

	// Hiding a page in the settings has to close the one you are standing on, and the same
	// guard catches a URL that names a route the sidebar does not offer.
	const reachable = $derived(new Set<string>(navItems.map((item) => item.key)));

	// Against the route, not the optimistic key: a click that has not arrived yet is on its
	// way to a page the sidebar does offer, and bouncing it here would cancel it mid-flight.
	$effect(() => {
		if (!reachable.has(routeKey)) void goto(resolve(ROUTES.overview));
	});

	// The rail pushes the site aside, and the header bar pushes it down.
	$effect(() => {
		const sidebar = sidebarExpanded ? SIDEBAR_EXPANDED_WIDTH : SIDEBAR_COLLAPSED_WIDTH;
		void bridge.call('layout.setSiteInset', {
			left:
				sidebar +
				(panelVisible ? ACTION_RAIL_WIDTH : 0) +
				(assistantVisible ? ASSISTANT_PANEL_WIDTH : 0),
			top: HEADER_HEIGHT,
			bottom: railPlatform ? STATUS_BAR_HEIGHT : 0
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
		// A dropdown in the header is taller than the strip the chrome owns while a platform is
		// up, so the platform steps aside for as long as one is open — otherwise the entries
		// render behind a webview and the menu looks broken.
		if (!platform || headerMenuOpen || dialogOpen) {
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
<svelte:window bind:innerWidth={windowWidth} />

<ModeWatcher disableTransitions={false} />
<!-- Bottom left, and not by preference: while X or YouTube is showing, this page only owns
     the sidebar column and a 44px strip above the site webview. A toast on the right lands
     inside that strip and gets cut off, because a separate webview is painting over
     everything below it. The left column is the one place with room in both states. -->
<Toaster position="bottom-left" />

<BootSplash />

<div bind:this={shell} class="flex h-screen bg-background">
	<SidebarShell {navItems} {activeKey} {onNavigate} bind:expanded={sidebarExpanded} />

	<!-- Everything right of the sidebar, stacked: the actions and the view side by side, and
	     the status bar underneath both. It reaches under the actions because the run it
	     reports was started there. -->
	<div class="flex min-w-0 flex-1 flex-col">
		<div class="flex min-h-0 flex-1">
			<!-- First of the app's own columns, so the platform page keeps the far side of the
			     window: what is being asked about stays where it was while the asking happens. -->
			{#if assistantVisible}
				<AssistantPanel
					{bridge}
					{logStore}
					{settingsStore}
					{loginStore}
					{runner}
					onClose={() => (assistantOpen = false)}
				/>
			{/if}

			{#if railPlatform === 'x'}
				<XView
					{bridge}
					{settingsStore}
					{loginStore}
					{runner}
					open={panelVisible}
					startDeleteAll={deleteAllFor === 'x'}
					onDeleteAllStarted={() => (deleteAllFor = undefined)}
					onDialogOpenChange={(open: boolean) => (dialogOpen = open)}
					onClose={() => (panelClosedByUser = true)}
				/>
			{:else if railPlatform === 'youtube'}
				<YouTubeView
					{bridge}
					{settingsStore}
					{loginStore}
					{runner}
					open={panelVisible}
					startDeleteAll={deleteAllFor === 'youtube'}
					onDeleteAllStarted={() => (deleteAllFor = undefined)}
					onDialogOpenChange={(open: boolean) => (dialogOpen = open)}
					onClose={() => (panelClosedByUser = true)}
				/>
			{/if}

			<!-- The header sits over this column alone, not across the window: it spans exactly
			     the rectangle the host gives the site webview (`left` counts the sidebar and the
			     panel, `top` is this bar), so the two line up whether a local page or a platform
			     is showing. It stays put while X or YouTube is up — that is what keeps saying
			     where the user is — because only `main` below it fades. -->
			<div class="flex min-w-0 flex-1 flex-col">
				<PageHeader
					title={current.label}
					icon={current.icon}
					iconOnly={activeKey === 'x'}
					{location}
					{settingsStore}
					onMenuOpenChange={(open: boolean) => (headerMenuOpen = open)}
					onToggleAssistant={() => (assistantOpen = !assistantOpen)}
					assistantOpen={assistantVisible}
					onOpenActions={railPlatform && !panelVisible
						? () => {
								panelClosedByUser = false;
								panelFoldedByWidth = false;
							}
						: undefined}
				/>

				<!-- Fades out before the host swaps in the site webview, and back on the way home. -->
				<main
					class={cn(
						'relative min-h-0 flex-1 overflow-hidden transition-opacity duration-150 ease-out',
						railPlatform ? 'pointer-events-none opacity-0' : 'opacity-100'
					)}
				>
					{@render children()}
				</main>
			</div>
		</div>

		<!-- Under the actions as well as under the view: the run it reports was started in that
		     column. The host shortens the site webview by exactly this height (`bottom` in the
		     inset) — a webview cannot be painted over, so the room has to be real. The local
		     pages have no run to report and get their full height back. -->
		{#if railPlatform}
			<StatusBar {runner} platform={railPlatform} />
		{/if}
	</div>
</div>
