import {
	clickWithCursor,
	delay,
	highlightElement,
	isVisible,
	postLog,
	postProgress,
	waitForByScrolling
} from '../dom';
import { siteConfig } from '../config';
import type { RunParams } from '../protocol';
import type { DeleteActionDefinition } from '../types';

function findUnlikeButton(): HTMLButtonElement | null {
	return document.querySelector<HTMLButtonElement>(siteConfig.x.unlike);
}

async function clickUnlikeButton(waitTime: number): Promise<boolean> {
	const btn = findUnlikeButton();
	if (!isVisible(btn)) return false;

	highlightElement(btn.closest('article') ?? btn);
	clickWithCursor(btn);
	await delay(waitTime);

	return findUnlikeButton() === null;
}

async function tryUnlike(waitTime: number, maxTries: number): Promise<boolean> {
	for (let attempt = 1; attempt <= maxTries; attempt++) {
		if (await clickUnlikeButton(waitTime)) return true;

		if (attempt < maxTries) {
			await delay(500 + 500 * attempt);
		}
	}
	return false;
}

export const likesAction: DeleteActionDefinition = {
	isEmpty(): boolean {
		return document.querySelector('[data-testid="emptyState"]') !== null;
	},

	async run(params: RunParams): Promise<number> {
		let deletedCount = 0;

		while (true) {
			const found = await waitForByScrolling(() => findUnlikeButton() !== null, 500, {
				maxWaitMs: 5000,
				intervalMs: 200
			});
			if (!found) {
				postLog('info', 'No unlike buttons found; ending.');
				break;
			}

			const success = await tryUnlike(params.waitBetweenRetryDeleteAttempts, 10);
			if (!success) {
				postLog('info', 'Failed to unlike; stopping.');
				break;
			}

			deletedCount++;
			postProgress(params.requestId, deletedCount);
			await delay(params.waitAfterDelete);
		}

		return deletedCount;
	}
};
