<script lang="ts">
  import { onMount, type Snippet } from 'svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import { ModeWatcher, setMode } from 'mode-watcher';
  import { createBridgeClient } from '$lib/bridge/client';
  import { createTauriHost, isTauri } from '$lib/bridge/tauri-host';
  import { createMockHost, defaultMockHandlers } from '$lib/bridge/mock';
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
  import { applyAccent } from '$lib/theme/accent';
  import XIcon from '$lib/components/icons/x-icon.svelte';
  import YouTubeIcon from '$lib/components/icons/youtube-icon.svelte';
  import ScrollTextIcon from '@lucide/svelte/icons/scroll-text';
  import SettingsIcon from '@lucide/svelte/icons/settings';
  import '../app.css';

  /**
   * The local app, shown in the chrome webview (column 0): the sidebar with the
   * X/YouTube action panels as subnav, plus the Settings/Log pages in the content
   * area. The platform site itself loads in the separate site webview (column 1);
   * the host swaps between them via `site.hide` and tracks the sidebar width via
   * `layout.setSidebarExpanded`.
   */

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();

  // `vite dev` in a plain browser has no host — fall back to an in-memory mock so the UI is still previewable.
  const bridge = isTauri() ? createBridgeClient(createTauriHost()) : createMockHost(defaultMockHandlers()).client;

  const settingsStore = new SettingsStore(bridge);
  const logStore = new LogStore(bridge);
  const loginStore = new SiteLoginStore(bridge);
  // One runner for the whole app: a deletion keeps reporting progress in the sidebar
  // even after the user navigates away from the panel that started it.
  const runner = new ActionRunner(bridge);

  setAppContext({ bridge, settingsStore, logStore, loginStore, runner });

  type NavKey = 'x' | 'youtube' | 'log' | 'settings';

  const activeKey = $derived((page.url.pathname.split('/')[1] || 'settings') as NavKey);
  let sidebarExpanded = $state(true);

  onMount(async () => {
    await Promise.all([settingsStore.load(), logStore.load()]);
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
    void goto(`/${key}`);
    if (key === 'x' || key === 'youtube') {
      void bridge.call('site.hide', { hide: false });
      void bridge.call('site.navigate', { platform: key, action: key === 'x' ? 'showPosts' : 'showComments' });
    } else {
      void bridge.call('site.hide', { hide: true });
    }
  }

  $effect(() => {
    if (activeKey === 'log' && !settingsStore.settings.showLogs) {
      void goto('/settings');
    }
  });

  $effect(() => {
    void bridge.call('layout.setSidebarExpanded', { expanded: sidebarExpanded });
  });
</script>

<ModeWatcher />
<Toaster />

<div class="flex h-screen flex-col">
  <!-- Sits directly below the system title bar; kept free of controls so the two read as one. -->
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

    <main class="relative min-w-0 flex-1 overflow-hidden">
      {@render children()}
    </main>
  </div>
</div>
