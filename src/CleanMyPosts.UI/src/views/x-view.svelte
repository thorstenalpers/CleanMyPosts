<script lang="ts">
  import { toast } from 'svelte-sonner';
  import type { BridgeClient } from '$lib/bridge/client';
  import type { SettingsStore } from '$lib/stores/settings.svelte';
  import type { SiteLoginStore } from '$lib/stores/site-login.svelte';
  import { ActionRunner } from '$lib/stores/action-runner.svelte';
  import ActionRow from '$lib/components/action-row.svelte';
  import { ConfirmDialog } from '$lib/components/ui/alert-dialog';
  import MessagesSquareIcon from '@lucide/svelte/icons/messages-square';
  import ReplyIcon from '@lucide/svelte/icons/reply';
  import Repeat2Icon from '@lucide/svelte/icons/repeat-2';
  import HeartIcon from '@lucide/svelte/icons/heart';
  import UserMinusIcon from '@lucide/svelte/icons/user-minus';

  interface Props {
    bridge: BridgeClient;
    settingsStore: SettingsStore;
    loginStore: SiteLoginStore;
  }

  let { bridge, settingsStore, loginStore }: Props = $props();

  // `bridge` never changes after mount; `$derived` just satisfies Svelte's reactivity lint.
  const runner = $derived(new ActionRunner(bridge));

  const groups = [
    { key: 'posts', label: 'Posts', icon: MessagesSquareIcon, showAction: 'showPosts', deleteAction: 'deletePosts', noun: 'post' },
    { key: 'replies', label: 'Replies', icon: ReplyIcon, showAction: 'showReplies', deleteAction: 'deleteReplies', noun: 'reply' },
    { key: 'reposts', label: 'Reposts', icon: Repeat2Icon, showAction: 'showReposts', deleteAction: 'deleteReposts', noun: 'repost' },
    { key: 'likes', label: 'Likes', icon: HeartIcon, showAction: 'showLikes', deleteAction: 'deleteLikes', noun: 'like' },
    {
      key: 'following',
      label: 'Following',
      icon: UserMinusIcon,
      showAction: 'showFollowing',
      deleteAction: 'deleteFollowing',
      noun: 'following'
    }
  ] as const;

  let confirmTarget = $state<(typeof groups)[number] | undefined>(undefined);
  let confirmOpen = $state(false);

  const buttonsEnabled = $derived(!!loginStore.loggedIn.x && !runner.running);

  // The sidebar lives in the narrow chrome WebView; a confirm dialog there can only
  // center within it. Expand the chrome over the whole window while the dialog is open
  // (site hidden), then restore the site so the user can watch the deletion run.
  $effect(() => {
    void bridge.call('site.hide', { hide: confirmOpen });
  });

  async function show(action: (typeof groups)[number]['showAction']): Promise<void> {
    await bridge.call('site.navigate', { platform: 'x', action });
  }

  async function runDelete(group: (typeof groups)[number]): Promise<void> {
    const result = await runner.run({
      platform: 'x',
      action: group.deleteAction,
      timeouts: settingsStore.settings.timeouts,
      label: group.label
    });
    toast.success(`${result.deletedCount} ${group.noun}${result.deletedCount === 1 ? '' : 's'} cleaned successfully.`);
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
  {#if !loginStore.loggedIn.x}
    <p class="text-muted-foreground px-3 pt-1 text-xs">Sign in to X to enable cleaning.</p>
  {/if}
</div>

{#if confirmTarget}
  <ConfirmDialog
    bind:open={confirmOpen}
    title="Confirm Deletion"
    description={`Are you sure you want to delete all ${confirmTarget.noun}s?`}
    onConfirm={onConfirm}
    onCancel={onCancel}
  />
{/if}
