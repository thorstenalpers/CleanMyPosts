<script lang="ts">
  import { onMount, type Component } from 'svelte';
  import { ModeWatcher } from 'mode-watcher';
  import { getBridge } from '$lib/bridge/client';
  import { createMockHost, defaultMockHandlers } from '$lib/bridge/mock';
  import { SettingsStore } from '$lib/stores/settings.svelte';
  import { LogStore } from '$lib/stores/log.svelte';
  import { Toaster } from '$lib/components/ui/sonner';
  import SidebarShell from '$lib/components/sidebar-shell.svelte';
  import SettingsView from './views/settings-view.svelte';
  import LogView from './views/log-view.svelte';
  import XView from './views/x-view.svelte';
  import YouTubeView from './views/youtube-view.svelte';
  import { SiteLoginStore } from '$lib/stores/site-login.svelte';
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

  // `vite dev` in a plain browser has no WebView2 host — fall back to an in-memory mock so the UI is still previewable.
  const bridge = window.chrome?.webview ? getBridge() : createMockHost(defaultMockHandlers()).client;

  const settingsStore = new SettingsStore(bridge);
  const logStore = new LogStore(bridge);
  const loginStore = new SiteLoginStore(bridge);

  type LocalView = 'log' | 'settings';
  type NavKey = 'x' | 'youtube' | LocalView;

  let activeKey = $state<NavKey>(location.hash === '#log' ? 'log' : 'settings');
  let sidebarExpanded = $state(true);

  onMount(() => {
    void settingsStore.load();
    void logStore.load();
  });

  const navItems = $derived(
    [
      { key: 'x' as const, label: 'X', icon: XIcon },
      { key: 'youtube' as const, label: 'YouTube', icon: YouTubeIcon },
      ...(settingsStore.settings.showLogs ? [{ key: 'log' as const, label: 'Log', icon: ScrollTextIcon }] : []),
      { key: 'settings' as const, label: 'Settings', icon: SettingsIcon, footer: true }
    ] satisfies { key: NavKey; label: string; icon: Component; footer?: boolean }[]
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

<div class="flex h-screen">
  <SidebarShell {navItems} {activeKey} {onNavigate} bind:expanded={sidebarExpanded}>
    {#snippet subnav(key)}
      {#if key === 'x'}
        <XView {bridge} {settingsStore} {loginStore} />
      {:else if key === 'youtube'}
        <YouTubeView {bridge} {settingsStore} {loginStore} />
      {/if}
    {/snippet}
  </SidebarShell>

  <main class="min-w-0 flex-1 overflow-hidden">
    {#if activeKey === 'log'}
      <LogView {logStore} />
    {:else if activeKey === 'settings'}
      <SettingsView {bridge} {settingsStore} />
    {/if}
  </main>
</div>
