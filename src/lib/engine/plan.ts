/**
 * Runs an action plan the assistant wrote.
 *
 * A plan is a short list of steps over a fixed vocabulary, checked against `ActionPlanSchema`
 * in the chrome before it ever reaches this file. That is the whole point of the shape: the
 * app never evaluates text a model produced, so a wrong plan can only do things the engine
 * could already do — click something, wait for something, scroll.
 *
 * The types here are written out rather than imported from `$lib/bridge/contract.ts`. That
 * module is the chrome's, it pulls in zod, and this file is bundled into a script that is
 * injected into x.com and youtube.com. They are kept in step by hand, the same way
 * `protocol.ts` and the bridge contract already are.
 */
import {
	clickWithCursor,
	delay,
	highlightElement,
	isVisible,
	postLog,
	postProgress,
	waitFor,
	waitForByScrolling
} from './dom';
import type { RunParams } from './protocol';
import type { DeleteActionDefinition } from './types';

export interface Target {
	selector: string;
	text?: string;
}

export type PlanStep =
	| { step: 'click'; target: Target; pointerSequence?: boolean }
	| { step: 'waitFor'; target: Target; maxWaitMs?: number }
	| { step: 'waitGone'; target: Target; maxWaitMs?: number }
	| { step: 'scrollUntil'; target: Target; maxWaitMs?: number }
	| { step: 'wait'; ms: number }
	| { step: 'navigate'; url: string };

export interface ActionPlan {
	/** `loop` empties a list; `once` does the steps a single time. */
	kind?: 'loop' | 'once';
	target?: Target;
	steps: PlanStep[];
}

/**
 * Where a plan is allowed to send the page.
 *
 * The same hosts the injected script guards, and for the same reason. A step that could point
 * a signed-in session at any address is not a step in a plan — it is a way out of the app, and
 * whatever wrote the plan does not get to decide that.
 */
const ALLOWED_HOSTS = ['x.com', 'youtube.com', 'myactivity.google.com'];

export function isAllowedUrl(url: string): boolean {
	let host: string;
	try {
		const parsed = new URL(url);
		if (parsed.protocol !== 'https:') return false;
		host = parsed.host.toLowerCase();
	} catch {
		return false;
	}
	// Whole host, never a substring: "x.com.example.net" ends in neither.
	return ALLOWED_HOSTS.some((allowed) => host === allowed || host.endsWith(`.${allowed}`));
}

/** A round that removes nothing is the signal to stop, so the loop needs a ceiling too. */
const MAX_ROUNDS = 5000;
const DEFAULT_WAIT = 5000;

/**
 * The one element a target names.
 *
 * A selector the platform no longer has is not an error worth failing a run over — it is the
 * ordinary way a plan goes stale — so a bad selector reads the same as no match. `:has` and
 * the like are recent enough that a hand-written selector can still throw here.
 */
export function findTarget(target: Target): HTMLElement | null {
	let matches: Element[];
	try {
		matches = Array.from(document.querySelectorAll(target.selector));
	} catch {
		postLog(
			'warning',
			`The plan's selector is not one this browser understands: ${target.selector}`
		);
		return null;
	}

	const wanted = target.text?.trim().toLowerCase();
	for (const match of matches) {
		if (!isVisible(match)) continue;
		if (wanted === undefined) return match;
		if ((match.textContent ?? '').toLowerCase().includes(wanted)) return match;
	}
	return null;
}

/**
 * How many the target finds, without touching one of them.
 *
 * The dry run behind the assistant's "check first" — the one way to judge a plan before it is
 * allowed to delete anything. Counts what is on screen, so on a list that loads by scrolling
 * it answers for what has loaded so far and not for the account as a whole.
 */
export function countTargets(target: Target): number {
	let matches: Element[];
	try {
		matches = Array.from(document.querySelectorAll(target.selector));
	} catch {
		return 0;
	}

	const wanted = target.text?.trim().toLowerCase();
	return matches.filter(
		(match) =>
			isVisible(match) &&
			(wanted === undefined || (match.textContent ?? '').toLowerCase().includes(wanted))
	).length;
}

async function runStep(step: PlanStep): Promise<boolean> {
	switch (step.step) {
		case 'wait':
			await delay(step.ms);
			return true;

		case 'navigate':
			if (!isAllowedUrl(step.url)) {
				postLog('warning', `The plan tried to open an address it is not allowed to: ${step.url}`);
				return false;
			}
			window.location.assign(step.url);
			// Nothing after a navigation runs: this document is on its way out. Reported as
			// done so the round counts, rather than as a step that found nothing.
			return true;

		case 'click': {
			const el = findTarget(step.target);
			if (!el) return false;
			highlightElement(el);
			clickWithCursor(el, { pointerSequence: step.pointerSequence ?? false });
			return true;
		}

		case 'waitFor':
			return (
				(await waitFor(() => findTarget(step.target), {
					maxWaitMs: step.maxWaitMs ?? DEFAULT_WAIT
				})) !== undefined
			);

		case 'waitGone':
			return (
				(await waitFor(() => findTarget(step.target) === null || undefined, {
					maxWaitMs: step.maxWaitMs ?? DEFAULT_WAIT
				})) !== undefined
			);

		case 'scrollUntil':
			return (
				(await waitForByScrolling(() => findTarget(step.target), 500, {
					maxWaitMs: step.maxWaitMs ?? DEFAULT_WAIT
				})) !== undefined
			);
	}
}

/**
 * Wraps a plan in the same loop the built-in actions run.
 *
 * Repeating, counting, the wait between deletions and the reporting all stay here rather than
 * in the plan: they are what makes a run slow enough not to be flagged and stoppable while it
 * goes, and none of that is a model's decision.
 *
 * A round whose steps did not all succeed ends the run rather than retrying for ever. The
 * platform having changed under a saved plan is the expected way this stops, and saying so
 * once beats grinding through five thousand rounds of the same failure.
 */
export function planAction(plan: ActionPlan): DeleteActionDefinition {
	return {
		isEmpty(): boolean {
			// A one-shot plan is never "empty": there is nothing it is meant to exhaust.
			return plan.target === undefined ? false : findTarget(plan.target) === null;
		},

		async run(params: RunParams): Promise<number> {
			// One pass and no counting. Opening a page or dismissing a banner has nothing to
			// empty, so the loop below would have no way to know it was finished.
			if (plan.kind === 'once') {
				for (const step of plan.steps) {
					if (await runStep(step)) continue;
					postLog('info', `The plan's "${step.step}" step found nothing; stopping.`);
					return 0;
				}
				return 1;
			}

			let deletedCount = 0;

			const target = plan.target;
			if (!target) return 0;

			for (let round = 0; round < MAX_ROUNDS; round++) {
				const found = await waitForByScrolling(() => findTarget(target) !== null, 500, {
					maxWaitMs: DEFAULT_WAIT
				});
				if (!found) {
					postLog('info', 'Nothing left the plan matches; ending.');
					break;
				}

				let completed = true;
				for (const step of plan.steps) {
					if (await runStep(step)) continue;
					postLog('info', `The plan's "${step.step}" step found nothing; stopping.`);
					completed = false;
					break;
				}
				if (!completed) break;

				deletedCount++;
				postProgress(params.requestId, deletedCount);
				await delay(params.waitAfterDelete);
			}

			return deletedCount;
		}
	};
}
