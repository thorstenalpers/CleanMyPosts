import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { activityAction } from './activity';

describe('activityAction.isEmpty', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('is empty when no delete button is present', () => {
		expect(activityAction.isEmpty()).toBe(true);
	});

	it('is not empty when a delete button is present', () => {
		document.body.innerHTML =
			'<div role="listitem"><button aria-label="Delete activity item"></button></div>';
		expect(activityAction.isEmpty()).toBe(false);
	});

	// The row is what tells this button from the "delete by date and product" control at the top
	// of My Activity, which carries the same word and empties far more than one comment.
	it('ignores a delete button that is not inside an activity row', () => {
		document.body.innerHTML = '<button aria-label="Delete activity"></button>';
		expect(activityAction.isEmpty()).toBe(true);
	});

	it('ignores a row button whose label is not about deleting', () => {
		document.body.innerHTML =
			'<div role="listitem"><button aria-label="More options"></button></div>';
		expect(activityAction.isEmpty()).toBe(true);
	});
});

describe('activityAction.run', () => {
	beforeEach(() => {
		window.chrome = {
			webview: { postMessage: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn() }
		};
	});

	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('returns 0 when no delete button is ever found', async () => {
		// maxFailures=3, each retry waits up to the action's hardcoded 5s scroll-timeout.
		const deletedCount = await activityAction.run({
			requestId: 'r1',
			waitAfterDelete: 1,
			waitBetweenRetryDeleteAttempts: 1
		});
		expect(deletedCount).toBe(0);
	}, 20000);

	// The point of reading the notice is the time it saves; a version that still waited out the
	// scroll timeouts would pass every other assertion here.
	it('stops at once when the page says there is no activity', async () => {
		document.body.innerHTML = '<div role="main"><p>No activity</p></div>';
		const started = Date.now();
		const deletedCount = await activityAction.run({
			requestId: 'r1',
			waitAfterDelete: 1,
			waitBetweenRetryDeleteAttempts: 1
		});
		expect(deletedCount).toBe(0);
		expect(Date.now() - started).toBeLessThan(1000);
	});

	it('does not read the notice off the surrounding chrome', async () => {
		document.body.innerHTML =
			'<nav>No activity</nav><div role="main"><div role="listitem"></div></div>';
		const started = Date.now();
		await activityAction.run({
			requestId: 'r1',
			waitAfterDelete: 1,
			waitBetweenRetryDeleteAttempts: 1
		});
		// Nothing to delete either way, so the only evidence it did not take the shortcut is
		// that it spent the timeouts looking.
		expect(Date.now() - started).toBeGreaterThan(1000);
	}, 20000);
});
