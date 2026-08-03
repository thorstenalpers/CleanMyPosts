import type { Component } from 'svelte';
import type { SiteAction } from '$lib/bridge/contract';
import type { MessageKey } from '$lib/i18n/index.svelte';
import MessagesSquareIcon from '@lucide/svelte/icons/messages-square';
import MessageSquareIcon from '@lucide/svelte/icons/message-square';
import ReplyIcon from '@lucide/svelte/icons/reply';
import Repeat2Icon from '@lucide/svelte/icons/repeat-2';
import HeartIcon from '@lucide/svelte/icons/heart';
import UserMinusIcon from '@lucide/svelte/icons/user-minus';

export interface ActionGroupDef {
	key: string;
	/** Message keys, not text: the same group is named in the panel, the dialog and a toast. */
	label: MessageKey;
	icon: Component;
	showAction: SiteAction;
	deleteAction: SiteAction;
	/** The plural the confirm dialog and the result toast read as a noun. */
	plural: MessageKey;
}

// Shared rather than declared per view: the overview lists what a platform cleans, and a
// list that can drift from the buttons is worse than no list at all.
export const X_GROUPS: ActionGroupDef[] = [
	{
		key: 'posts',
		label: 'group.posts',
		icon: MessagesSquareIcon,
		showAction: 'showPosts',
		deleteAction: 'deletePosts',
		plural: 'plural.posts'
	},
	{
		key: 'replies',
		label: 'group.replies',
		icon: ReplyIcon,
		showAction: 'showReplies',
		deleteAction: 'deleteReplies',
		plural: 'plural.replies'
	},
	{
		key: 'reposts',
		label: 'group.reposts',
		icon: Repeat2Icon,
		showAction: 'showReposts',
		deleteAction: 'deleteReposts',
		plural: 'plural.reposts'
	},
	{
		key: 'likes',
		label: 'group.likes',
		icon: HeartIcon,
		showAction: 'showLikes',
		deleteAction: 'deleteLikes',
		plural: 'plural.likes'
	},
	{
		key: 'following',
		label: 'group.following',
		icon: UserMinusIcon,
		showAction: 'showFollowing',
		deleteAction: 'deleteFollowing',
		plural: 'plural.following'
	}
];

export const YOUTUBE_GROUPS: ActionGroupDef[] = [
	{
		key: 'comments',
		label: 'group.comments',
		icon: MessageSquareIcon,
		showAction: 'showComments',
		deleteAction: 'deleteComments',
		plural: 'plural.comments'
	},
	{
		key: 'likes',
		label: 'group.likes',
		icon: HeartIcon,
		showAction: 'showLikes',
		deleteAction: 'deleteLikes',
		plural: 'plural.likedVideos'
	}
];
