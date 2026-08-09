import { describe, expect, it, beforeEach, vi } from 'vitest';
import { findTarget, isAllowedUrl, planAction, type ActionPlan } from './plan';

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
		kind: 'loop',
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

/**
 * The shape for everything that is not a deletion: opening a page, dismissing a banner,
 * expanding a section. There is nothing to exhaust, so the loop that empties a list would
 * have no way of knowing it had finished.
 */
describe('a plan that runs once', () => {
	beforeEach(() => {
		document.body.innerHTML = '';
	});

	it('does its steps a single time and needs no target', async () => {
		document.body.innerHTML = '<button class="accept"></button>';
		visible(document.querySelector('.accept')!);
		let clicks = 0;
		document.body.addEventListener('click', () => clicks++);

		const plan: ActionPlan = {
			kind: 'once',
			steps: [{ step: 'click', target: { selector: '.accept' } }]
		};
		const done = await planAction(plan).run(params);

		expect(clicks).toBe(1);
		expect(done).toBe(1);
	});

	// It empties nothing, so "is there anything left" has no answer for it.
	it('is never reported as empty', () => {
		expect(planAction({ kind: 'once', steps: [{ step: 'wait', ms: 0 }] }).isEmpty()).toBe(false);
	});

	it('stops at the first step that finds nothing', async () => {
		const plan: ActionPlan = {
			kind: 'once',
			steps: [{ step: 'click', target: { selector: '.not-there' } }]
		};

		expect(await planAction(plan).run(params)).toBe(0);
	});
});

/**
 * A step that could point a signed-in session at any address is not a step in a plan — it is
 * a way out of the app, and whatever wrote the plan does not get to decide that.
 */
describe('where a plan may navigate', () => {
	it('takes the platforms the engine is injected into', () => {
		expect(isAllowedUrl('https://www.youtube.com/feed/channels')).toBe(true);
		expect(isAllowedUrl('https://x.com/home')).toBe(true);
		expect(isAllowedUrl('https://myactivity.google.com/page')).toBe(true);
		// The two pages that change the site's own language, so a run can be watched in another
		// one without a VPN: YouTube persists it from the URL, X has a settings page for it.
		expect(isAllowedUrl('https://www.youtube.com/?persist_hl=1&hl=es')).toBe(true);
		expect(isAllowedUrl('https://x.com/settings/language')).toBe(true);
	});

	it('refuses anywhere else, and anything that is not https', () => {
		expect(isAllowedUrl('https://evil.test/steal')).toBe(false);
		expect(isAllowedUrl('http://x.com/home')).toBe(false);
		expect(isAllowedUrl('javascript:alert(1)')).toBe(false);
		expect(isAllowedUrl('not a url')).toBe(false);
	});

	// The rule the origin guard in the injected script already lives by: a whole host, never a
	// substring, or "x.com.example.net" would pass for X.
	it('matches whole hosts, not substrings', () => {
		expect(isAllowedUrl('https://x.com.example.net/')).toBe(false);
		expect(isAllowedUrl('https://notyoutube.com/')).toBe(false);
		expect(isAllowedUrl('https://mobile.x.com/home')).toBe(true);
	});
});

/**
 * The one step that puts something on the page rather than taking it away. Everything else in
 * the vocabulary can only trigger what the page already offered.
 */
describe('typing into a field', () => {
	beforeEach(() => {
		document.body.innerHTML = '';
	});

	async function type(markup: string, text = 'hello') {
		document.body.innerHTML = markup;
		document.querySelectorAll('*').forEach(visible);
		const plan: ActionPlan = {
			kind: 'once',
			steps: [{ step: 'type', target: { selector: '#field' }, text }]
		};
		return planAction(plan).run(params);
	}

	/**
	 * Both platforms render with a framework that keeps its own copy of the field's state and
	 * only listens for the event. A plain assignment leaves the box looking filled and the app
	 * behind it thinking it is empty — the search runs on nothing, the button stays disabled.
	 */
	it('tells the page about it, not just the element', async () => {
		document.body.innerHTML = '<input id="field" />';
		document.querySelectorAll('*').forEach(visible);
		const heard: string[] = [];
		document.body.addEventListener('input', () => heard.push('input'));
		document.body.addEventListener('change', () => heard.push('change'));

		await planAction({
			kind: 'once',
			steps: [{ step: 'type', target: { selector: '#field' }, text: 'cats' }]
		}).run(params);

		expect(document.querySelector<HTMLInputElement>('#field')?.value).toBe('cats');
		expect(heard).toEqual(['input', 'change']);
	});

	it('fills a textarea and a contenteditable too', async () => {
		expect(await type('<textarea id="field"></textarea>')).toBe(1);
		expect(document.querySelector<HTMLTextAreaElement>('#field')?.value).toBe('hello');

		document.body.innerHTML = '<div id="field" contenteditable="true"></div>';
		document.querySelectorAll('*').forEach(visible);
		const el = document.querySelector<HTMLElement>('#field')!;
		// happy-dom does not derive isContentEditable from the attribute.
		Object.defineProperty(el, 'isContentEditable', { value: true });
		await planAction({
			kind: 'once',
			steps: [{ step: 'type', target: { selector: '#field' }, text: 'hello' }]
		}).run(params);
		expect(el.textContent).toBe('hello');
	});

	it('stops rather than pretending, when the target takes no text', async () => {
		expect(await type('<div id="field"></div>')).toBe(0);
	});
});

describe('pressing a key', () => {
	beforeEach(() => {
		document.body.innerHTML = '';
	});

	// The whole sequence, so a handler listening for any one of them hears it.
	it('sends the sequence a key produces', async () => {
		document.body.innerHTML = '<input id="field" />';
		document.querySelectorAll('*').forEach(visible);
		const seen: string[] = [];
		for (const type of ['keydown', 'keypress', 'keyup']) {
			document.body.addEventListener(type, (event) =>
				seen.push(`${type}:${(event as KeyboardEvent).key}`)
			);
		}

		await planAction({
			kind: 'once',
			steps: [{ step: 'press', key: 'Enter', target: { selector: '#field' } }]
		}).run(params);

		expect(seen).toEqual(['keydown:Enter', 'keypress:Enter', 'keyup:Enter']);
	});

	// Without a target it goes wherever the focus is, which is what a key does.
	it('goes to whatever has the focus when no target is named', async () => {
		document.body.innerHTML = '<input id="field" />';
		document.querySelectorAll('*').forEach(visible);
		const field = document.querySelector<HTMLInputElement>('#field')!;
		field.focus();
		let heard = false;
		field.addEventListener('keydown', () => (heard = true));

		await planAction({ kind: 'once', steps: [{ step: 'press', key: 'Escape' }] }).run(params);

		expect(heard).toBe(true);
	});
});
