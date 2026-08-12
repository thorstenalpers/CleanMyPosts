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

/**
 * Whether the page says outright that there is nothing here.
 *
 * Worth asking before the scroll timeout rather than after it: `waitForByScrolling` spends its
 * full five seconds finding nothing on a page that already carries the answer in plain text,
 * and a run that re-runs itself on a reloaded page spends them twice.
 */
function pageSaysEmpty(): boolean {
	// Every match, not the first: `querySelector` on a comma list answers with whichever comes
	// first in the document, and on this page that is a `c-wiz` wrapper around the chrome.
	for (const scope of document.querySelectorAll<HTMLElement>(siteConfig.youtube.emptyScope)) {
		if (matchesAny(scope.innerText ?? '', siteConfig.youtube.emptyText)) return true;
	}
	return false;
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

		/**
		 * How long the search for another row may go on, in total, since the last one was found.
		 *
		 * A budget rather than a per-attempt timeout: the loop scrolls and looks again, so three
		 * five-second attempts spent fifteen seconds at the end of every run deciding a list was
		 * empty. Nothing is lost by cutting it — the caller re-runs the action on a reloaded page
		 * whenever a pass deleted anything, and a row that needed longer turns up on that pass.
		 *
		 * Reset by a row being found and by "show more", so it bounds the tail of a run rather
		 * than the run itself: a list of two thousand takes as long as it takes.
		 */
		const searchBudgetMs = 1000;
		let searchingSince = Date.now();

		while (failures < maxFailures) {
			dismissSurveyBanner();

			// Before the timeout, not after it: the page has already answered.
			if (findDeleteButton() === null && pageSaysEmpty()) {
				postLog('info', 'The page says there is no activity left.');
				break;
			}

			const found = await waitForByScrolling(() => findDeleteButton() !== null, 400, {
				maxWaitMs: 400,
				intervalMs: 200
			});

			if (!found) {
				failures++;

				const loadMoreBtn = findLoadMoreButton();
				if (loadMoreBtn) {
					// More to come is not the case this budget is about, so it starts over.
					clickWithCursor(loadMoreBtn);
					await delay(1000);
					failures = 0;
					searchingSince = Date.now();
					continue;
				}

				if (Date.now() - searchingSince > searchBudgetMs) {
					postLog('info', 'Nothing more turned up in time; treating the list as empty.');
					break;
				}

				const prevScroll = window.scrollY;
				window.scrollBy(0, 500);
				await delay(500);

				if (window.scrollY === prevScroll) {
					postLog('info', 'No scroll change; assuming the list is empty.');
					break;
				}
				continue;
			}

			searchingSince = Date.now();

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
