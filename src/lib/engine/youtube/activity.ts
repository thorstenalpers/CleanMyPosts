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

/**
 * The ✕ on an activity row.
 *
 * Structure plus wording, because the only thing that told these buttons apart cheaply was a
 * generated `jscontroller` value, and those rotate with a Google deployment.
 */
function findDeleteButton(): HTMLButtonElement | null {
	for (const button of document.querySelectorAll<HTMLButtonElement>(
		siteConfig.youtube.deleteActivity
	)) {
		const label = button.getAttribute('aria-label') ?? '';
		if (matchesAny(label, siteConfig.youtube.deleteActivityText)) return button;
	}
	return null;
}

/** The "Show more" under a day group, found the same way and for the same reason. */
function findLoadMoreButton(): HTMLElement | null {
	for (const button of document.querySelectorAll<HTMLElement>(siteConfig.youtube.loadMore)) {
		if (button.offsetParent === null) continue;
		const text = `${button.textContent ?? ''} ${button.getAttribute('aria-label') ?? ''}`;
		if (matchesAny(text, siteConfig.youtube.loadMoreText)) return button;
	}
	return null;
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

		for (const btn of document.querySelectorAll<HTMLElement>(siteConfig.youtube.confirmButton)) {
			if (btn.offsetParent === null) continue;
			// The label lives in a span, except where the sheet does not use one — then the button's
			// own text is the label. A generated class used to pick the span out; it no longer can.
			const label =
				btn.querySelector(siteConfig.youtube.confirmLabel)?.textContent ?? btn.textContent;
			if (matchesAny(label ?? '', siteConfig.youtube.confirmDeleteText)) {
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

/**
 * One list on Google My Activity, emptied a row at a time.
 *
 * Serves both of YouTube's lists, because both live here: comments under
 * `page=youtube_comments` and liked videos under `page=youtube_likes`. Which one is on screen
 * is the caller's business — the rows are the same rows, and the ✕ on them is the same button.
 *
 * Liked videos used to be taken from the Liked videos playlist instead, where removing one
 * means opening a ⋮ menu and hitting an entry that three different YouTube renderers each
 * place somewhere else. This page has neither the menu nor the renderers, and it lists
 * disliked videos alongside the liked ones, which the playlist never showed at all.
 */
export const activityAction: DeleteActionDefinition = {
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

				const loadMoreBtn = findLoadMoreButton();
				if (loadMoreBtn) {
					clickWithCursor(loadMoreBtn);
					await delay(1000);
					failures = 0;
					continue;
				}

				if (window.scrollY === prevScroll) {
					postLog('info', 'No scroll change; assuming the list is empty.');
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
