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
		document.body.innerHTML = '<button aria-label="Delete activity item"></button>';
		expect(commentsAction.isEmpty()).toBe(false);
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
