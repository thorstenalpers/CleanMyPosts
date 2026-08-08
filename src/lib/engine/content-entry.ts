import { xActions, getUserName, getLoginStatus as getXLoginStatus } from './x';
import { youTubeActions, getLoginStatus as getYouTubeLoginStatus } from './youtube';
import { startConsentWatcher } from './consent';
import { siteConfig } from './config';
import { hideCursor, hideShield, postDone, postError, postLog, showShield, showToast } from './dom';
import { countTargets, planAction, type ActionPlan, type Target } from './plan';
import type { CmpApi, Platform, RunParams, XAction, YouTubeAction } from './protocol';
import type { DeleteActionDefinition } from './types';

function getActionDefinition(
	platform: Platform,
	action: XAction | YouTubeAction
): DeleteActionDefinition | undefined {
	return platform === 'x' ? xActions[action as XAction] : youTubeActions[action as YouTubeAction];
}

/**
 * Drives one definition to its end and reports it.
 *
 * Shared by the built-in actions and by a plan, deliberately: the shield, the pointer and the
 * one report back are what a run *is*, and a plan that skipped any of them would be a second
 * kind of run with a second set of guarantees.
 */
function drive(definition: DeleteActionDefinition, params: RunParams, what: string): void {
	showShield();
	definition
		.run(params)
		.then((deletedCount) => postDone(params.requestId, deletedCount))
		.catch((error: unknown) => {
			const message = error instanceof Error ? error.message : String(error);
			postLog('error', `${what} failed: ${message}`);
			postError(params.requestId, message);
		})
		// Whatever the outcome: the run is over, so the pointer stops standing on the page
		// and the page takes clicks again.
		.finally(() => {
			hideCursor();
			hideShield();
		});
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

		drive(definition, params, `${platform}:${action}`);
	},

	runPlan(paramsJson) {
		const params = JSON.parse(paramsJson) as RunParams & { plan: ActionPlan };
		drive(planAction(params.plan), params, 'the plan');
	},

	// No shield and no pointer: nothing is clicked, so there is nothing to protect the page
	// from and nothing to show. Counting is the one thing here that leaves the page as it was.
	countMatches(requestId, targetJson) {
		const target = JSON.parse(targetJson) as Target;
		try {
			postDone(requestId, countTargets(target));
		} catch (error: unknown) {
			postError(requestId, error instanceof Error ? error.message : String(error));
		}
	},

	isEmpty(platform, action) {
		return getActionDefinition(platform, action)?.isEmpty() ?? true;
	},

	getUserName,
	toast: showToast,
	shield: (on) => (on ? showShield() : hideShield()),

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
