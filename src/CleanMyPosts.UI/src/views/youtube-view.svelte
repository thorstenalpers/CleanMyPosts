<script lang="ts">
  import { toast } from 'svelte-sonner';
  import type { BridgeClient } from '$lib/bridge/client';
  import type { SettingsStore } from '$lib/stores/settings.svelte';
  import type { SiteLoginStore } from '$lib/stores/site-login.svelte';
  import { ActionRunner } from '$lib/stores/action-runner.svelte';
  import ActionRow from '$lib/components/action-row.svelte';
  import { ConfirmDialog } from '$lib/components/ui/alert-dialog';
  import MessageSquareIcon from '@lucide/svelte/icons/message-square';
  import HeartIcon from '@lucide/svelte/icons/heart';

  interface Props {
    bridge: BridgeClient;
    settingsStore: SettingsStore;
    loginStore: SiteLoginStore;
  }

  let { bridge, settingsStore, loginStore }: Props = $props();

  // `bridge` never changes after mount; `$derived` just satisfies Svelte's reactivity lint.
  const runner = $derived(new ActionRunner(bridge));

  const groups = [
    { key: 'comments', label: 'Comments', icon: MessageSquareIcon, showAction: 'showComments', deleteAction: 'deleteComments', noun: 'comment' },
    { key: 'likes', label: 'Likes', icon: HeartIcon, showAction: 'showLikes', deleteAction: 'deleteLikes', noun: 'like' }
  ] as const;

  let confirmTarget = $state<(typeof groups)[number] | undefined>(undefined);
  let confirmOpen = $state(false);

  const buttonsEnabled = $derived(!!loginStore.loggedIn.youtube && !runner.running);

  // The sidebar lives in the narrow chrome WebView; a confirm dialog there can only
  // center within it. Expand the chrome over the whole window while the dialog is open
  // (site hidden), then restore the site so the user can watch the deletion run.
  $effect(() => {
    void bridge.call('site.hide', { hide: confirmOpen });
  });

  async function show(action: (typeof groups)[number]['showAction']): Promise<void> {
    await bridge.call('site.navigate', { platform: 'youtube', action });
  }

  async function runDelete(group: (typeof groups)[number]): Promise<void> {
    const result = await runner.run({
      platform: 'youtube',
      action: group.deleteAction,
      timeouts: settingsStore.settings.timeouts,
      label: group.label
    });
    toast.success(`${result.deletedCount} ${group.noun}${result.deletedCount === 1 ? '' : 's'} cleaned.`);
  }

  function onDeleteClick(group: (typeof groups)[number]): void {
    if (settingsStore.settings.confirmDeletion) {
      confirmTarget = group;
      confirmOpen = true;
    } else {
      void runDelete(group);
    }
  }

  async function onConfirm(): Promise<void> {
    confirmOpen = false;
    if (confirmTarget) await runDelete(confirmTarget);
  }

  function onCancel(): void {
    confirmOpen = false;
  }
</script>

<div class="flex flex-col gap-0.5 py-0.5">
  {#each groups as group (group.key)}
    <ActionRow
      label={group.label}
      icon={group.icon}
      disabled={!buttonsEnabled}
      onShow={() => show(group.showAction)}
      onDelete={() => onDeleteClick(group)}
    />
  {/each}
  {#if !loginStore.loggedIn.youtube}
    <p class="text-muted-foreground px-3 pt-1 text-xs">Sign in to YouTube to enable cleaning.</p>
  {/if}
</div>

{#if confirmTarget}
  <ConfirmDialog
    bind:open={confirmOpen}
    title="Confirm Deletion"
    description={`Are you sure you want to remove all ${confirmTarget.noun === 'comment' ? 'comments' : 'liked videos'}?`}
    onConfirm={onConfirm}
    onCancel={onCancel}
  />
{/if}
