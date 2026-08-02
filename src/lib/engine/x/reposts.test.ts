import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { repostsAction } from './reposts';

function markVisible(el: HTMLElement): void {
	el.getClientRects = () => [{} as DOMRect] as unknown as DOMRectList;
	Object.defineProperty(el, 'offsetParent', { value: document.body, configurable: true });
}

describe('repostsAction.isEmpty', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('is empty when no article is present', () => {
		expect(repostsAction.isEmpty()).toBe(true);
	});
});

describe('repostsAction.run', () => {
	beforeEach(() => {
		window.chrome = {
			webview: { postMessage: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn() }
		};
	});

	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('unretweets, confirms, and stops once the button disappears', async () => {
		const unretweetBtn = document.createElement('button');
		unretweetBtn.setAttribute('data-testid', 'unretweet');
		markVisible(unretweetBtn);
		document.body.append(unretweetBtn);

		const confirmItem = document.createElement('div');
		confirmItem.setAttribute('role', 'menuitem');
		confirmItem.setAttribute('data-testid', 'unretweetConfirm');
		markVisible(confirmItem);
		document.body.append(confirmItem);

		unretweetBtn.addEventListener('click', () => unretweetBtn.remove());
		confirmItem.addEventListener('click', () => confirmItem.remove());

		const deletedCount = await repostsAction.run({
			requestId: 'r1',
			waitAfterDelete: 1,
			waitBetweenRetryDeleteAttempts: 1
		});
		expect(deletedCount).toBe(1);
	}, 10000);

	it('returns 0 when no unretweet button is ever found', async () => {
		const deletedCount = await repostsAction.run({
			requestId: 'r2',
			waitAfterDelete: 1,
			waitBetweenRetryDeleteAttempts: 1
		});
		expect(deletedCount).toBe(0);
	}, 10000);
});
