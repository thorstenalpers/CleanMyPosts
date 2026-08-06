import { xActions, getUserName, getLoginStatus as getXLoginStatus } from './x';
import { youTubeActions, getLoginStatus as getYouTubeLoginStatus } from './youtube';
import { startConsentWatcher } from './consent';
import { siteConfig } from './config';
import { hideCursor, postDone, postError, postLog, showToast } from './dom';
import type { CmpApi, Platform, RunParams, XAction, YouTubeAction } from './protocol';
import type { DeleteActionDefinition } from './types';

function getActionDefinition(
	platform: Platform,
	action: XAction | YouTubeAction
): DeleteActionDefinition | undefined {
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
			})
			// Whatever the outcome: the run is over, so the pointer stops standing on the page.
			.finally(hideCursor);
	},

	isEmpty(platform, action) {
		return getActionDefinition(platform, action)?.isEmpty() ?? true;
	},

	getUserName,
	toast: showToast,

	// The two platforms are told apart by their own host: this file is one script, injected
	// into both, and answering an X page with YouTube's avatar heuristic reports nothing.
	getLoginStatus() {
		// Matched as a whole host, not as a substring: "x.com.example.net" contains "x.com"
		// and is not X. The injected script already guards the origin, but that guard lives
		// in another file and this one has to stand on its own.
		const host = window.location.host;
		const isX = host === 'x.com' || host.endsWith('.x.com');
		return isX ? getXLoginStatus() : getYouTubeLoginStatus();
	},

	// Handed out, not copied: the host evaluates the user's patch against this object between
	// page load and the run that follows, and the actions read it as they go.
	config: siteConfig
};

window.__cmp = api;

// This file is an initialization script, so every navigation on the site webview starts a
// fresh watch — the cookie bar X shows on the first page of a session never survives to the
// point where the user is asked to click something behind it.
startConsentWatcher();
