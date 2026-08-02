import type { XAction } from '../protocol';
import type { DeleteActionDefinition } from '../types';
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
  const el = document.querySelector('a[data-testid="AppTabBar_Profile_Link"]');
  const href = el?.getAttribute('href');
  return href?.split('/')[1] ?? '';
}
