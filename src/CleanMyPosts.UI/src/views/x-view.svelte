<script lang="ts">
  import type { BridgeClient } from '$lib/bridge/client';
  import type { SettingsStore } from '$lib/stores/settings.svelte';
  import type { SiteLoginStore } from '$lib/stores/site-login.svelte';
  import type { ActionRunner } from '$lib/stores/action-runner.svelte';
  import PlatformPanel, { type ActionGroupDef } from './platform-panel.svelte';
  import MessagesSquareIcon from '@lucide/svelte/icons/messages-square';
  import ReplyIcon from '@lucide/svelte/icons/reply';
  import Repeat2Icon from '@lucide/svelte/icons/repeat-2';
  import HeartIcon from '@lucide/svelte/icons/heart';
  import UserMinusIcon from '@lucide/svelte/icons/user-minus';

  interface Props {
    bridge: BridgeClient;
    settingsStore: SettingsStore;
    loginStore: SiteLoginStore;
    runner: ActionRunner;
  }

  let { bridge, settingsStore, loginStore, runner }: Props = $props();

  const groups: ActionGroupDef[] = [
    { key: 'posts', label: 'Posts', icon: MessagesSquareIcon, showAction: 'showPosts', deleteAction: 'deletePosts', plural: 'posts' },
    { key: 'replies', label: 'Replies', icon: ReplyIcon, showAction: 'showReplies', deleteAction: 'deleteReplies', plural: 'replies' },
    { key: 'reposts', label: 'Reposts', icon: Repeat2Icon, showAction: 'showReposts', deleteAction: 'deleteReposts', plural: 'reposts' },
    { key: 'likes', label: 'Likes', icon: HeartIcon, showAction: 'showLikes', deleteAction: 'deleteLikes', plural: 'likes' },
    { key: 'following', label: 'Following', icon: UserMinusIcon, showAction: 'showFollowing', deleteAction: 'deleteFollowing', plural: 'followed accounts' }
  ];
</script>

<PlatformPanel
  {bridge}
  {settingsStore}
  {runner}
  platform="x"
  platformLabel="X"
  {groups}
  loggedIn={!!loginStore.loggedIn.x}
/>
