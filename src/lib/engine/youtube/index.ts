import type { YouTubeAction } from '../protocol';
import type { DeleteActionDefinition } from '../types';
import { siteConfig } from '../config';
import { activityAction } from './activity';

/**
 * Both of them are the same page with a different query.
 *
 * Comments and liked videos are two lists on Google My Activity, built from the same rows and
 * deleted by the same ✕. Which list is open is decided by the url the host navigates to; from
 * here they are indistinguishable, and there is nothing to tell apart.
 */
export const youTubeActions: Record<YouTubeAction, DeleteActionDefinition> = {
	deleteComments: activityAction,
	deleteLikes: activityAction
};

/**
 * Evidence of an account first, the sign-in prompt second. The pages this runs on —
 * youtube.com and My Activity — share no single marker, and My Activity carries account links
 * whether or not anyone is signed in.
 */
export function getLoginStatus(): string {
	if (document.querySelector(siteConfig.youtube.signedIn)) return 'logged_in';
	if (document.querySelector(siteConfig.youtube.signedOut)) return '';
	return 'unknown';
}
