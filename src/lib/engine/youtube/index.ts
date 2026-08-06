import type { YouTubeAction } from '../protocol';
import type { DeleteActionDefinition } from '../types';
import { siteConfig } from '../config';
import { commentsAction } from './comments';
import { youTubeLikesAction } from './likes';

export const youTubeActions: Record<YouTubeAction, DeleteActionDefinition> = {
	deleteComments: commentsAction,
	deleteLikes: youTubeLikesAction
};

/**
 * Evidence of an account first, the sign-in prompt second. The three pages this runs on —
 * youtube.com, the Liked playlist and My Activity — share no single marker, and My Activity
 * carries account links whether or not anyone is signed in.
 */
export function getLoginStatus(): string {
	if (document.querySelector(siteConfig.youtube.signedIn)) return 'logged_in';
	if (document.querySelector(siteConfig.youtube.signedOut)) return '';
	return 'unknown';
}
