import type { YouTubeAction } from '../protocol';
import type { DeleteActionDefinition } from '../types';
import { commentsAction } from './comments';
import { youTubeLikesAction } from './likes';

export const youTubeActions: Record<YouTubeAction, DeleteActionDefinition> = {
  deleteComments: commentsAction,
  deleteLikes: youTubeLikesAction
};

export function getLoginStatus(): string {
  const avatar = document.querySelector<HTMLImageElement>('button#avatar-btn img, yt-img-shadow#avatar img');
  if (avatar?.src) return 'logged_in';

  const signInLink = document.querySelector(
    'a[href*="accounts.google.com"], ytd-button-renderer a[href*="ServiceLogin"]'
  );
  if (signInLink) return '';

  if (document.querySelectorAll('div[role="listitem"]').length > 0) return 'logged_in';
  if (document.querySelectorAll('button[aria-label^="Delete activity item"]').length > 0) return 'logged_in';
  if (document.querySelector('[data-activity-collection-name]')) return 'logged_in';
  if (document.querySelectorAll('ytd-playlist-video-renderer').length > 0) return 'logged_in';

  return 'unknown';
}
