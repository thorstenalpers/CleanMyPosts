<script lang="ts">
	import type { BridgeClient } from '$lib/bridge/client';
	import type { SettingsStore } from '$lib/stores/settings.svelte';
	import type { SiteLoginStore } from '$lib/stores/site-login.svelte';
	import type { ActionRunner } from '$lib/stores/action-runner.svelte';
	import PlatformPanel, { type ActionGroupDef } from './platform-panel.svelte';
	import MessageSquareIcon from '@lucide/svelte/icons/message-square';
	import HeartIcon from '@lucide/svelte/icons/heart';

	interface Props {
		bridge: BridgeClient;
		settingsStore: SettingsStore;
		loginStore: SiteLoginStore;
		runner: ActionRunner;
	}

	let { bridge, settingsStore, loginStore, runner }: Props = $props();

	const groups: ActionGroupDef[] = [
		{
			key: 'comments',
			label: 'Comments',
			icon: MessageSquareIcon,
			showAction: 'showComments',
			deleteAction: 'deleteComments',
			plural: 'comments'
		},
		{
			key: 'likes',
			label: 'Likes',
			icon: HeartIcon,
			showAction: 'showLikes',
			deleteAction: 'deleteLikes',
			plural: 'liked videos'
		}
	];
</script>

<PlatformPanel
	{bridge}
	{settingsStore}
	{runner}
	platform="youtube"
	platformLabel="YouTube"
	{groups}
	loggedIn={!!loginStore.loggedIn.youtube}
/>
