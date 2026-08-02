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

function isReplyByUser(article: Element, userName: string): boolean {
	const userLink = article.querySelector(`a[href^="/${userName}"]`);
	const repostMarker = article.querySelector('button[data-testid="unretweet"]');
	return userLink !== null && repostMarker === null;
}

function findReplyArticle(userName: string): Element | undefined {
	return Array.from(document.querySelectorAll("article[data-testid='tweet']")).find((article) =>
		isReplyByUser(article, userName)
	);
}

async function findCaretWithRetry(
	article: Element,
	maxRetries = 5,
	delayMs = 200
): Promise<HTMLElement | null> {
	for (let i = 0; i < maxRetries; i++) {
		const caret = article.querySelector<HTMLElement>("button[aria-label='More']");
		if (isVisible(caret)) return caret;
		await delay(delayMs);
	}
	return null;
}

async function tryClickDeleteMenuItem(attempts: number, baseDelay: number): Promise<boolean> {
	for (let i = 0; i < attempts; i++) {
		await delay(baseDelay * (i + 1));
		for (const item of document.querySelectorAll("[role='menuitem']")) {
			const span = item.querySelector('span');
			if (span?.innerText.toLowerCase().includes('delete')) {
				clickWithCursor(span);
				return true;
			}
		}
	}
	return false;
}

async function tryConfirmDelete(attempts: number, baseDelay: number): Promise<boolean> {
	for (let i = 0; i < attempts; i++) {
		await delay(baseDelay * (i + 1));
		const confirmBtn = document.querySelector<HTMLButtonElement>(
			"button[data-testid='confirmationSheetConfirm']"
		);
		if (isVisible(confirmBtn)) {
			clickWithCursor(confirmBtn);
			return true;
		}
	}
	return false;
}

async function clickDeleteOnReply(
	userName: string,
	waitBetweenRetryDeleteAttempts: number
): Promise<boolean> {
	const replyArticle = findReplyArticle(userName);
	if (!replyArticle) return false;

	const caret = await findCaretWithRetry(replyArticle);
	if (!caret) return false;

	highlightElement(replyArticle as HTMLElement);
	clickWithCursor(caret);
	await delay(waitBetweenRetryDeleteAttempts);

	if (!(await tryClickDeleteMenuItem(3, waitBetweenRetryDeleteAttempts))) return false;
	return tryConfirmDelete(3, waitBetweenRetryDeleteAttempts);
}

export const repliesAction: DeleteActionDefinition = {
	isEmpty(): boolean {
		return document.querySelector('article') === null;
	},

	async run(params: RunParams): Promise<number> {
		if (!params.userName) {
			postLog('error', 'deleteReplies requires userName.');
			return 0;
		}
		const userName = params.userName;

		let deletedCount = 0;

		while (true) {
			const found = await waitForByScrolling(() => findReplyArticle(userName) !== undefined, 600, {
				maxWaitMs: 7000,
				intervalMs: 200
			});
			if (!found) {
				postLog('info', 'No more visible replies.');
				break;
			}

			const deleted = await clickDeleteOnReply(userName, params.waitBetweenRetryDeleteAttempts);
			if (!deleted) {
				postLog('info', 'Failed to delete a reply; stopping.');
				break;
			}

			deletedCount++;
			postProgress(params.requestId, deletedCount);
			await delay(params.waitAfterDelete);
		}

		return deletedCount;
	}
};
