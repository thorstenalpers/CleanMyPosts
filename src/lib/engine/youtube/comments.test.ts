import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { commentsAction } from './comments';

describe('commentsAction.isEmpty', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('is empty when no delete button is present', () => {
		expect(commentsAction.isEmpty()).toBe(true);
	});

	it('is not empty when a delete button is present', () => {
		document.body.innerHTML =
			'<div role="listitem"><button aria-label="Delete activity item"></button></div>';
		expect(commentsAction.isEmpty()).toBe(false);
	});

	// The row is what tells this button from the "delete by date and product" control at the top
	// of My Activity, which carries the same word and empties far more than one comment.
	it('ignores a delete button that is not inside an activity row', () => {
		document.body.innerHTML = '<button aria-label="Delete activity"></button>';
		expect(commentsAction.isEmpty()).toBe(true);
	});

	it('ignores a row button whose label is not about deleting', () => {
		document.body.innerHTML =
			'<div role="listitem"><button aria-label="More options"></button></div>';
		expect(commentsAction.isEmpty()).toBe(true);
	});
});

describe('commentsAction.run', () => {
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
		const deletedCount = await commentsAction.run({
			requestId: 'r1',
			waitAfterDelete: 1,
			waitBetweenRetryDeleteAttempts: 1
		});
		expect(deletedCount).toBe(0);
	}, 20000);
});
