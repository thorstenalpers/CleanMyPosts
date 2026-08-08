import { describe, expect, it, beforeEach, vi } from 'vitest';
import { findTarget, planAction, type ActionPlan } from './plan';

const params = { requestId: 'r1', waitAfterDelete: 0, waitBetweenRetryDeleteAttempts: 0 };

/** happy-dom lays nothing out, so visibility has to be answered the way a browser would. */
function visible(el: Element): void {
	el.getClientRects = () => [{} as DOMRect] as unknown as DOMRectList;
}

describe('finding what a plan names', () => {
	beforeEach(() => {
		document.body.innerHTML = '';
	});

	it('takes the first visible match', () => {
		document.body.innerHTML = '<button id="a"></button><button id="b"></button>';
		document.querySelectorAll('button').forEach(visible);

		expect(findTarget({ selector: 'button' })?.id).toBe('a');
	});

	// How both platforms are actually navigated: a menu entry has no mark of its own, only
	// the words it carries.
	it('narrows to the one carrying the word, whatever its case', () => {
		document.body.innerHTML =
			'<div role="menuitem">Share</div><div role="menuitem">Remove from Liked videos</div>';
		document.querySelectorAll('[role=menuitem]').forEach(visible);

		const found = findTarget({ selector: '[role=menuitem]', text: 'remove from liked' });

		expect(found?.textContent).toBe('Remove from Liked videos');
	});

	// Expressed through `disabled` because that is the one state happy-dom answers the way a
	// browser does; it lays nothing out, so an off-screen element still reports an offsetParent.
	it('passes over a control that cannot be clicked', () => {
		document.body.innerHTML = '<button id="off" disabled></button><button id="live"></button>';
		document.querySelectorAll('button').forEach(visible);

		expect(findTarget({ selector: 'button' })?.id).toBe('live');
	});

	// A plan goes stale as a matter of course, and a selector this browser cannot parse is the
	// same kind of nothing as a selector that matches nothing.
	it('reads a selector it cannot parse as no match rather than throwing', () => {
		expect(() => findTarget({ selector: '::::' })).not.toThrow();
		expect(findTarget({ selector: '::::' })).toBeNull();
	});
});

describe('running a plan', () => {
	beforeEach(() => {
		document.body.innerHTML = '';
	});

	const removeOne: ActionPlan = {
		target: { selector: '.item' },
		steps: [{ step: 'click', target: { selector: '.item' } }]
	};

	it('counts one for every round it completes and stops when the list is empty', async () => {
		document.body.innerHTML = '<div class="item"></div><div class="item"></div>';
		document.querySelectorAll('.item').forEach(visible);
		// What the platform would do: the clicked row leaves the page.
		document.body.addEventListener('click', (event) => (event.target as Element).remove());

		const deleted = await planAction(removeOne).run(params);

		expect(deleted).toBe(2);
		expect(document.querySelectorAll('.item')).toHaveLength(0);
		// The last round spends the engine's own five-second look for more before it concludes
		// the list is empty, which is longer than a test is given by default.
	}, 10000);

	it('is empty when nothing matches', () => {
		expect(planAction(removeOne).isEmpty()).toBe(true);

		document.body.innerHTML = '<div class="item"></div>';
		visible(document.querySelector('.item')!);
		expect(planAction(removeOne).isEmpty()).toBe(false);
	});

	/**
	 * The expected way a saved plan dies: the platform moved the button it named. Grinding
	 * through five thousand identical failures is not a better answer than saying so once.
	 */
	it('stops at the first step that finds nothing rather than looping on it', async () => {
		document.body.innerHTML = '<div class="item"></div>';
		visible(document.querySelector('.item')!);

		const plan: ActionPlan = {
			target: { selector: '.item' },
			steps: [
				{ step: 'click', target: { selector: '.item' } },
				{ step: 'click', target: { selector: '.confirm-that-is-not-there' } }
			]
		};

		const deleted = await planAction(plan).run(params);

		expect(deleted).toBe(0);
	});

	it('waits for something to go, and gives up on a deadline rather than hanging', async () => {
		vi.useFakeTimers();
		document.body.innerHTML = '<div class="item"></div><div class="stuck"></div>';
		document.querySelectorAll('div').forEach(visible);

		const plan: ActionPlan = {
			target: { selector: '.item' },
			steps: [{ step: 'waitGone', target: { selector: '.stuck' }, maxWaitMs: 1000 }]
		};
		const run = planAction(plan).run(params);
		await vi.advanceTimersByTimeAsync(2000);

		await expect(run).resolves.toBe(0);
		vi.useRealTimers();
	});
});
