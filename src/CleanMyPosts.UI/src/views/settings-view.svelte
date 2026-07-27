<script lang="ts">
  import { toast } from 'svelte-sonner';
  import { setMode } from 'mode-watcher';
  import type { BridgeClient } from '$lib/bridge/client';
  import type { SettingsStore } from '$lib/stores/settings.svelte';
  import { AppSettingsSchema, type AppInfo, type AppTheme } from '$lib/bridge/contract';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Switch } from '$lib/components/ui/switch';
  import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
  import SunIcon from '@lucide/svelte/icons/sun';
  import MoonIcon from '@lucide/svelte/icons/moon';
  import LaptopIcon from '@lucide/svelte/icons/laptop';
  import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
  import ExternalLinkIcon from '@lucide/svelte/icons/external-link';
  import BugIcon from '@lucide/svelte/icons/bug';
  import FileTextIcon from '@lucide/svelte/icons/file-text';

  interface Props {
    bridge: BridgeClient;
    settingsStore: SettingsStore;
  }

  let { bridge, settingsStore }: Props = $props();

  let appInfo = $state<AppInfo | undefined>(undefined);
  let checkingUpdates = $state(false);

  $effect(() => {
    bridge.call('app.getInfo', undefined).then((info) => (appInfo = info));
  });

  const themes: { value: AppTheme; label: string; icon: typeof SunIcon }[] = [
    { value: 'Light', label: 'Light', icon: SunIcon },
    { value: 'Dark', label: 'Dark', icon: MoonIcon },
    { value: 'Default', label: 'System', icon: LaptopIcon }
  ];

  async function commit(next: Partial<typeof settingsStore.settings>): Promise<void> {
    const merged = { ...settingsStore.settings, ...next };
    const parsed = AppSettingsSchema.safeParse(merged);
    if (!parsed.success) {
      toast.error('Invalid settings value.');
      return;
    }
    await settingsStore.update(parsed.data);
  }

  async function setTheme(theme: AppTheme): Promise<void> {
    setMode(theme === 'Default' ? 'system' : theme === 'Dark' ? 'dark' : 'light');
    await commit({ theme });
  }

  async function checkForUpdates(): Promise<void> {
    checkingUpdates = true;
    try {
      const result = await bridge.call('updater.checkForUpdates', undefined);
      if (!result.updateAvailable) {
        toast.info(result.message ?? 'No updates available.');
      }
    } finally {
      checkingUpdates = false;
    }
  }

  async function openUrl(url: string): Promise<void> {
    await bridge.call('system.openUrl', { url });
  }

  async function openLicense(): Promise<void> {
    await bridge.call('system.openLicense', undefined);
  }
</script>

<div class="flex h-full flex-col gap-4 overflow-auto p-4">
  <Card>
    <CardHeader>
      <CardTitle>Theme</CardTitle>
    </CardHeader>
    <CardContent class="flex gap-2">
      {#each themes as theme (theme.value)}
        <Button
          variant={settingsStore.settings.theme === theme.value ? 'default' : 'outline'}
          size="sm"
          onclick={() => setTheme(theme.value)}
        >
          <theme.icon />
          {theme.label}
        </Button>
      {/each}
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>Timeouts</CardTitle>
    </CardHeader>
    <CardContent class="flex flex-col gap-3">
      <div class="flex items-center gap-2">
        <Label class="w-56" for="wait-after-document-load">Wait after document loaded</Label>
        <Input
          id="wait-after-document-load"
          type="number"
          min="0"
          class="w-28"
          value={settingsStore.settings.timeouts.waitAfterDocumentLoad}
          onchange={(e) =>
            commit({
              timeouts: { ...settingsStore.settings.timeouts, waitAfterDocumentLoad: Number(e.currentTarget.value) }
            })}
        />
        <span class="text-muted-foreground text-sm">ms</span>
      </div>
      <div class="flex items-center gap-2">
        <Label class="w-56" for="wait-after-delete">Wait after delete</Label>
        <Input
          id="wait-after-delete"
          type="number"
          min="0"
          class="w-28"
          value={settingsStore.settings.timeouts.waitAfterDelete}
          onchange={(e) =>
            commit({ timeouts: { ...settingsStore.settings.timeouts, waitAfterDelete: Number(e.currentTarget.value) } })}
        />
        <span class="text-muted-foreground text-sm">ms</span>
      </div>
      <div class="flex items-center gap-2">
        <Label class="w-56" for="wait-between-retries">Wait between retry delete attempts</Label>
        <Input
          id="wait-between-retries"
          type="number"
          min="0"
          class="w-28"
          value={settingsStore.settings.timeouts.waitBetweenRetryDeleteAttempts}
          onchange={(e) =>
            commit({
              timeouts: { ...settingsStore.settings.timeouts, waitBetweenRetryDeleteAttempts: Number(e.currentTarget.value) }
            })}
        />
        <span class="text-muted-foreground text-sm">ms</span>
      </div>
    </CardContent>
  </Card>

  <Card>
    <CardContent class="flex flex-col gap-3 pt-3">
      <div class="flex items-center gap-2">
        <Switch
          id="confirm-deletion"
          checked={settingsStore.settings.confirmDeletion}
          onCheckedChange={(checked: boolean) => commit({ confirmDeletion: checked })}
        />
        <Label for="confirm-deletion">Ask for confirmation before deleting</Label>
      </div>
      <div class="flex items-center gap-2">
        <Switch id="show-logs" checked={settingsStore.settings.showLogs} onCheckedChange={(checked: boolean) => commit({ showLogs: checked })} />
        <Label for="show-logs">Show log tab</Label>
      </div>
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>About</CardTitle>
    </CardHeader>
    <CardContent class="flex flex-col gap-3">
      <p class="text-muted-foreground text-sm">CleanMyPosts {appInfo?.version ?? ''}</p>
      <div class="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" disabled={checkingUpdates} onclick={checkForUpdates}>
          <RefreshCwIcon />
          Check for Updates
        </Button>
        {#if appInfo}
          <Button variant="outline" size="sm" onclick={() => openUrl(appInfo!.homepageUrl)}>
            <ExternalLinkIcon />
            Project on GitHub
          </Button>
          <Button variant="outline" size="sm" onclick={() => openUrl(appInfo!.reportBugUrl)}>
            <BugIcon />
            Report a Bug
          </Button>
        {/if}
        <Button variant="outline" size="sm" onclick={openLicense}>
          <FileTextIcon />
          Third-Party Licenses
        </Button>
      </div>
    </CardContent>
  </Card>
</div>
