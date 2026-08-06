import type { XAction } from '../protocol';
import type { DeleteActionDefinition } from '../types';
import { siteConfig } from '../config';
import { postsAction } from './posts';
import { repliesAction } from './replies';
import { repostsAction } from './reposts';
import { likesAction } from './likes';
import { followingAction } from './following';

export const xActions: Record<XAction, DeleteActionDefinition> = {
	deletePosts: postsAction,
	deleteReplies: repliesAction,
	deleteReposts: repostsAction,
	deleteLikes: likesAction,
	deleteFollowing: followingAction
};

export function getUserName(): string {
	const href = document.querySelector(siteConfig.x.profileLink)?.getAttribute('href');
	const fromLink = href?.split('/')[1] ?? '';
	if (fromLink) return fromLink;

	// The nav rail drops the profile link at narrow widths and on some routes, while the
	// account button survives both. Without a handle no X url can be built at all, so it is
	// worth a second look before calling the user signed out.
	const account = document.querySelector(siteConfig.x.accountSwitcher);
	return /@(\w+)/.exec(account?.textContent ?? '')?.[1] ?? '';
}

export function getLoginStatus(): string {
	if (getUserName()) return 'logged_in';
	if (document.querySelector(siteConfig.x.signedOut)) return '';
	return 'unknown';
}
