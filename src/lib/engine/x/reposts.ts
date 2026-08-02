import {
	clickWithCursor,
	delay,
	highlightElement,
	isVisible,
	postLog,
	postProgress,
	waitForByScrolling
} from '../dom';
import type { RunParams } from '../protocol';
import type { DeleteActionDefinition } from '../types';

const UNRETWEET_SELECTOR = 'button[data-testid="unretweet"]';

function findUnretweetButton(): HTMLButtonElement | null {
	return document.querySelector<HTMLButtonElement>(UNRETWEET_SELECTOR);
}

async function confirmUnretweet(waitTime: number, maxRetries = 5): Promise<boolean> {
	for (let i = 0; i < maxRetries; i++) {
		await delay(waitTime * (i + 1));

		const menuItem = document.querySelector<HTMLElement>(
			'div[role="menuitem"][data-testid="unretweetConfirm"]'
		);
		if (isVisible(menuItem)) {
			clickWithCursor(menuItem);
			await delay(waitTime);
			return true;
		}
	}
	return false;
}

async function clickUnretweetButtonWithRetry(waitTime: number, maxTries = 5): Promise<boolean> {
	for (let attempt = 0; attempt < maxTries; attempt++) {
		const btn = findUnretweetButton();
		if (isVisible(btn)) {
			highlightElement(btn.closest('article') ?? btn);
			clickWithCursor(btn);
			await delay(500);

			if (await confirmUnretweet(waitTime)) return true;
		}

		await delay(500);
	}

	return false;
}

export const repostsAction: DeleteActionDefinition = {
	isEmpty(): boolean {
		return document.querySelector('article') === null;
	},

	async run(params: RunParams): Promise<number> {
		let deletedCount = 0;

		while (true) {
			const found = await waitForByScrolling(() => findUnretweetButton() !== null, 500, {
				maxWaitMs: 5000,
				intervalMs: 200
			});
			if (!found) {
				postLog('info', 'No more unretweet buttons found.');
				break;
			}

			const deleted = await clickUnretweetButtonWithRetry(params.waitBetweenRetryDeleteAttempts, 5);
			if (!deleted) {
				postLog('info', 'Failed to unretweet; stopping.');
				break;
			}

			deletedCount++;
			postProgress(params.requestId, deletedCount);
			await delay(params.waitAfterDelete);
		}

		return deletedCount;
	}
};
