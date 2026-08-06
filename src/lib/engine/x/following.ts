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

function findUnfollowButton(): HTMLButtonElement | null {
	return document.querySelector<HTMLButtonElement>(siteConfig.x.unfollow);
}

async function clickUnfollowButtonWithConfirm(
	waitBeforeTryClickDelete: number,
	waitBetweenTryClickDeleteAttempts: number,
	maxConfirmAttempts: number
): Promise<boolean> {
	const btn = findUnfollowButton();
	if (!isVisible(btn)) return false;

	highlightElement(btn.closest('[data-testid="UserCell"]') ?? btn);
	clickWithCursor(btn);
	await delay(waitBeforeTryClickDelete);

	for (let attempt = 0; attempt < maxConfirmAttempts; attempt++) {
		const confirmBtn = document.querySelector<HTMLButtonElement>(siteConfig.x.confirm);
		if (isVisible(confirmBtn)) {
			clickWithCursor(confirmBtn);
			return true;
		}

		await delay(waitBetweenTryClickDeleteAttempts * (attempt + 1));
	}

	return false;
}

async function tryUnfollow(
	waitBeforeTryClickDelete: number,
	waitBetweenTryClickDeleteAttempts: number,
	maxTries: number
): Promise<boolean> {
	for (let attempt = 1; attempt <= maxTries; attempt++) {
		if (
			await clickUnfollowButtonWithConfirm(
				waitBeforeTryClickDelete,
				waitBetweenTryClickDeleteAttempts,
				5
			)
		) {
			return true;
		}

		if (attempt < maxTries) {
			await delay(waitBetweenTryClickDeleteAttempts);
		}
	}
	return false;
}

export const followingAction: DeleteActionDefinition = {
	isEmpty(): boolean {
		return document.querySelector('[data-testid="emptyState"]') !== null;
	},

	async run(params: RunParams): Promise<number> {
		let deletedCount = 0;

		while (true) {
			const found = await waitForByScrolling(() => findUnfollowButton() !== null, 500, {
				maxWaitMs: 5000,
				intervalMs: 200
			});
			if (!found) {
				postLog('info', 'No unfollow buttons found after timeout.');
				break;
			}

			const success = await tryUnfollow(
				params.waitAfterDelete,
				params.waitBetweenRetryDeleteAttempts,
				10
			);
			if (!success) {
				postLog('info', 'Could not unfollow; aborting.');
				break;
			}

			deletedCount++;
			postProgress(params.requestId, deletedCount);
			await delay(params.waitAfterDelete);
		}

		return deletedCount;
	}
};
