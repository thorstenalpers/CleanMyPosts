import {
	clickWithCursor,
	delay,
	highlightElement,
	postLog,
	postProgress,
	waitForByScrolling
} from '../dom';
import { matchesAny, siteConfig } from '../config';
import type { RunParams } from '../protocol';
import type { DeleteActionDefinition } from '../types';

function findDeleteButton(): HTMLButtonElement | null {
	return document.querySelector<HTMLButtonElement>(siteConfig.youtube.deleteActivity);
}

/** A Google feedback/survey dialog can pop up mid-run and, being modal, blocks the next click. */
function dismissSurveyBanner(): void {
	const closeBtn = document.querySelector<HTMLElement>(siteConfig.youtube.closeDialog);
	if (closeBtn && closeBtn.getBoundingClientRect().width > 0) {
		clickWithCursor(closeBtn);
	}
}

async function clickConfirmDeleteButton(): Promise<boolean> {
	const delays = [100, 200, 300, 500, 500, 500, 1000, 1000];

	for (const ms of delays) {
		await delay(ms);

		const confirmDeleteBtn = document.querySelector<HTMLElement>(
			'div[role="button"][data-id="EBS5u"]'
		);
		if (confirmDeleteBtn && confirmDeleteBtn.offsetParent !== null) {
			clickWithCursor(confirmDeleteBtn);
			return true;
		}

		for (const btn of document.querySelectorAll<HTMLElement>(siteConfig.youtube.confirmButton)) {
			const deleteSpan = btn.querySelector(siteConfig.youtube.confirmLabel);
			if (
				deleteSpan &&
				matchesAny(deleteSpan.textContent ?? '', siteConfig.youtube.confirmDeleteText)
			) {
				clickWithCursor(btn);
				return true;
			}
		}
	}

	return false;
}

async function clickDeleteButton(waitBetweenRetryDeleteAttempts: number): Promise<boolean> {
	const deleteButton = findDeleteButton();
	if (!deleteButton) return false;

	highlightElement(deleteButton.closest('div[role="listitem"]') ?? deleteButton);
	clickWithCursor(deleteButton);
	await delay(waitBetweenRetryDeleteAttempts);

	await clickConfirmDeleteButton();
	await delay(300);

	const waitDelays = [100, 200, 300, 500, 500, 500, 1000];
	for (const ms of waitDelays) {
		await delay(ms);
		if (!document.contains(deleteButton)) return true;
	}

	return true;
}

export const commentsAction: DeleteActionDefinition = {
	isEmpty(): boolean {
		return findDeleteButton() === null;
	},

	async run(params: RunParams): Promise<number> {
		let deletedCount = 0;
		let failures = 0;
		const maxFailures = 3;

		while (failures < maxFailures) {
			dismissSurveyBanner();

			const found = await waitForByScrolling(() => findDeleteButton() !== null, 400, {
				maxWaitMs: 5000,
				intervalMs: 300
			});

			if (!found) {
				failures++;
				const prevScroll = window.scrollY;
				window.scrollBy(0, 500);
				await delay(500);

				const loadMoreBtn = document.querySelector<HTMLElement>(siteConfig.youtube.loadMore);
				if (loadMoreBtn && loadMoreBtn.offsetParent !== null) {
					clickWithCursor(loadMoreBtn);
					await delay(1000);
					failures = 0;
					continue;
				}

				if (window.scrollY === prevScroll) {
					postLog('info', 'No scroll change; assuming no more comments.');
					break;
				}
				continue;
			}

			const success = await clickDeleteButton(params.waitBetweenRetryDeleteAttempts);
			if (success) {
				deletedCount++;
				postProgress(params.requestId, deletedCount);
				failures = 0;
				await delay(params.waitAfterDelete);
			} else {
				failures++;
				await delay(500);
			}
		}

		return deletedCount;
	}
};
