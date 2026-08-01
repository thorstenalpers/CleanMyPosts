<script lang="ts">
  import { onMount } from 'svelte';
  import { ModeWatcher, setMode } from 'mode-watcher';
  import { createBridgeClient } from '$lib/bridge/client';
  import { createTauriHost, isTauri } from '$lib/bridge/tauri-host';
  import { createMockHost, defaultMockHandlers } from '$lib/bridge/mock';
  import { SettingsStore } from '$lib/stores/settings.svelte';
  import { LogStore } from '$lib/stores/log.svelte';
  import { SiteLoginStore } from '$lib/stores/site-login.svelte';
  import { ActionRunner } from '$lib/stores/action-runner.svelte';
  import { Toaster } from '$lib/components/ui/sonner';
  import SidebarShell, { type NavItem } from '$lib/components/sidebar-shell.svelte';
  import RunStatus from '$lib/components/run-status.svelte';
  import SettingsView from './views/settings-view.svelte';
  import LogView from './views/log-view.svelte';
  import XView from './views/x-view.svelte';
  import YouTubeView from './views/youtube-view.svelte';
  import { applyAccent } from '$lib/theme/accent';
  import XIcon from '$lib/components/icons/x-icon.svelte';
  import YouTubeIcon from '$lib/components/icons/youtube-icon.svelte';
  import ScrollTextIcon from '@lucide/svelte/icons/scroll-text';
  import SettingsIcon from '@lucide/svelte/icons/settings';

  /**
   * The local app on `cleanmyposts.local`, shown in the chrome WebView (column 0):
   * the sidebar with the X/YouTube action panels as subnav, plus the Settings/Log
   * pages in the content area. The platform site itself loads in the separate site
   * WebView (column 1); the host swaps between them via `site.hide` and tracks the
   * sidebar width via `layout.setSidebarExpanded`.
   */

  // `vite dev` in a plain browser has no host — fall back to an in-memory mock so the UI is still previewable.
  const bridge = isTauri() ? createBridgeClient(createTauriHost()) : createMockHost(defaultMockHandlers()).client;

  const settingsStore = new SettingsStore(bridge);
  const logStore = new LogStore(bridge);
  const loginStore = new SiteLoginStore(bridge);
  // One runner for the whole app: a deletion keeps reporting progress in the sidebar
  // even after the user navigates away from the panel that started it.
  const runner = new ActionRunner(bridge);

  type NavKey = 'x' | 'youtube' | 'log' | 'settings';

  let activeKey = $state<NavKey>(location.hash === '#log' ? 'log' : 'settings');
  let sidebarExpanded = $state(true);

  onMount(async () => {
    await Promise.all([settingsStore.load(), logStore.load()]);
    // Only now does the host drop its startup skeleton — the first real view is on screen.
    void bridge.call('app.ready', undefined);
  });

  $effect(() => {
    const { theme, accentColor } = settingsStore.settings;
    // Deferred: setMode writes mode-watcher's own state, and Svelte 5 rejects a state
    // write that happens while effects are still flushing.
    queueMicrotask(() => {
      setMode(theme === 'Light' ? 'light' : theme === 'Dark' ? 'dark' : 'system');
      applyAccent(accentColor);
    });
  });

  const navItems = $derived(
    [
      { key: 'x' as const, label: 'X', icon: XIcon, status: loginStore.loggedIn.x ? 'connected' : 'disconnected' },
      {
        key: 'youtube' as const,
        label: 'YouTube',
        icon: YouTubeIcon,
        status: loginStore.loggedIn.youtube ? 'connected' : 'disconnected'
      },
      ...(settingsStore.settings.showLogs ? [{ key: 'log' as const, label: 'Log', icon: ScrollTextIcon }] : []),
      { key: 'settings' as const, label: 'Settings', icon: SettingsIcon, footer: true }
    ] satisfies NavItem<NavKey>[]
  );

  function onNavigate(key: NavKey): void {
    activeKey = key;
    if (key === 'x' || key === 'youtube') {
      void bridge.call('site.hide', { hide: false });
      void bridge.call('site.navigate', { platform: key, action: key === 'x' ? 'showPosts' : 'showComments' });
    } else {
      void bridge.call('site.hide', { hide: true });
    }
  }

  $effect(() => {
    if (activeKey === 'log' && !settingsStore.settings.showLogs) {
      activeKey = 'settings';
    }
  });

  $effect(() => {
    void bridge.call('layout.setSidebarExpanded', { expanded: sidebarExpanded });
  });
</script>

<ModeWatcher />
<Toaster />

<div class="flex h-screen flex-col">
  <!-- Matches the host's title-bar drag region: the host owns dragging here, so nothing
       in this strip may be interactive. -->
  <header class="flex h-10 shrink-0 items-center px-3">
    <span class="text-[13px] font-semibold tracking-tight">CleanMyPosts</span>
  </header>

  <div class="bg-background flex min-h-0 flex-1">
    <SidebarShell {navItems} {activeKey} {onNavigate} bind:expanded={sidebarExpanded}>
      {#snippet subnav(key)}
        {#if key === 'x'}
          <XView {bridge} {settingsStore} {loginStore} {runner} />
        {:else if key === 'youtube'}
          <YouTubeView {bridge} {settingsStore} {loginStore} {runner} />
        {/if}
      {/snippet}

      {#snippet status()}
        {#if runner.running}
          <RunStatus label={runner.currentLabel} deletedCount={runner.deletedSoFar} onStop={() => runner.cancel()} />
        {/if}
      {/snippet}
    </SidebarShell>

    <!-- Pages stay mounted and are only hidden; unmounting would reset their filters, sorting
         and scroll offset. `visibility` rather than `display`, which drops layout and with it
         the scroll offset. -->
    <main class="relative min-w-0 flex-1 overflow-hidden">
      <div class="absolute inset-0" class:invisible={activeKey !== 'log'} inert={activeKey !== 'log'}>
        <LogView {logStore} />
      </div>
      <div class="absolute inset-0" class:invisible={activeKey !== 'settings'} inert={activeKey !== 'settings'}>
        <SettingsView {bridge} {settingsStore} />
      </div>
    </main>
  </div>
</div>
