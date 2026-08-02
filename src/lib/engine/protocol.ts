/**
 * Wire protocol between the host and the content-script running inside the
 * *site* webview (x.com / youtube.com). Distinct from `$lib/bridge/
 * contract.ts`, which governs the chrome-webview <-> host channel.
 *
 * `run`/`isEmpty` are invoked by the host via one-shot `eval` calls against
 * `window.__cmp`; `run` reports back asynchronously through
 * `chrome.webview.postMessage` instead of the host polling a `window`
 * variable — that round-trip-per-tick loop was the actual performance
 * problem in the previous implementation.
 */

export type Platform = 'x' | 'youtube';

export type XAction = 'deletePosts' | 'deleteReplies' | 'deleteReposts' | 'deleteLikes' | 'deleteFollowing';
export type YouTubeAction = 'deleteComments' | 'deleteLikes';

export interface RunParams {
  requestId: string;
  waitAfterDelete: number;
  waitBetweenRetryDeleteAttempts: number;
  userName?: string;
}

export interface ContentLogMessage {
  type: 'log';
  level: 'info' | 'warning' | 'error';
  message: string;
}

export interface ContentProgressMessage {
  type: 'progress';
  requestId: string;
  deletedCount: number;
  message?: string;
}

export interface ContentDoneMessage {
  type: 'done';
  requestId: string;
  deletedCount: number;
}

export interface ContentErrorMessage {
  type: 'error';
  requestId: string;
  message: string;
}

export type ContentMessage = ContentLogMessage | ContentProgressMessage | ContentDoneMessage | ContentErrorMessage;

export interface CmpApi {
  run(platform: Platform, action: XAction | YouTubeAction, paramsJson: string): void;
  isEmpty(platform: Platform, action: XAction | YouTubeAction): boolean;
  getUserName(): string;
  getLoginStatus(): string;
}

declare global {
  interface Window {
    __cmp?: CmpApi;
  }
}
