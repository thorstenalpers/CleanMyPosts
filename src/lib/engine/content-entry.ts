import { xActions, getUserName } from './x';
import { youTubeActions, getLoginStatus } from './youtube';
import { postDone, postError, postLog } from './dom';
import type { CmpApi, Platform, RunParams, XAction, YouTubeAction } from './protocol';
import type { DeleteActionDefinition } from './types';

function getActionDefinition(platform: Platform, action: XAction | YouTubeAction): DeleteActionDefinition | undefined {
  return platform === 'x' ? xActions[action as XAction] : youTubeActions[action as YouTubeAction];
}

const api: CmpApi = {
  run(platform, action, paramsJson) {
    // paramsJson always comes from the host's own JSON serializer, so a parse
    // failure here would be a host-side bug, not a reachable runtime state.
    const params = JSON.parse(paramsJson) as RunParams;

    const definition = getActionDefinition(platform, action);
    if (!definition) {
      const message = `Unknown action "${platform}:${action}"`;
      postLog('error', message);
      postError(params.requestId, message);
      return;
    }

    definition
      .run(params)
      .then((deletedCount) => postDone(params.requestId, deletedCount))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        postLog('error', `${platform}:${action} failed: ${message}`);
        postError(params.requestId, message);
      });
  },

  isEmpty(platform, action) {
    return getActionDefinition(platform, action)?.isEmpty() ?? true;
  },

  getUserName,
  getLoginStatus
};

window.__cmp = api;
