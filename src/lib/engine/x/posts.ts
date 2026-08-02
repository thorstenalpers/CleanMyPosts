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

const CARET_SELECTOR = "div[data-testid='primaryColumn'] section button[data-testid='caret']";

function findCaret(): Element | null {
	return document.querySelector(CARET_SELECTOR);
}

async function tryClickDeleteMenuItem(): Promise<boolean> {
	const delays = [100, 200, 300, 500, 500, 500, 500, 500, 1000, 1000];

	for (const ms of delays) {
		await delay(ms);

		const menu = document.querySelector<HTMLElement>("[role='menu']");
		if (!menu || menu.style.display === 'none') continue;

		for (const item of menu.querySelectorAll("[role='menuitem']")) {
			const span = item.querySelector('span');
			if (!span) continue;

			const color = getComputedStyle(span).color;
			const [r, g, b] = color.match(/\d+/g)?.map(Number) ?? [];
			if (r !== undefined && g !== undefined && b !== undefined && r > 180 && g < 100 && b < 100) {
				clickWithCursor(span);
				return true;
			}
		}
	}

	return false;
}

async function confirmDelete(): Promise<boolean> {
	const delays = [100, 200, 300, 500, 500, 500, 500, 500, 1000, 1000];

	for (const ms of delays) {
		await delay(ms);

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

async function clickDeleteOnPost(waitBetweenRetryDeleteAttempts: number): Promise<boolean> {
	const caret = findCaret();
	if (!caret) return false;

	highlightElement((caret.closest('article') as HTMLElement | null) ?? (caret as HTMLElement));
	clickWithCursor(caret as HTMLElement);
	await delay(waitBetweenRetryDeleteAttempts);

	if (!(await tryClickDeleteMenuItem())) return false;
	return confirmDelete();
}

export const postsAction: DeleteActionDefinition = {
	isEmpty(): boolean {
		return document.querySelector('article') === null;
	},

	async run(params: RunParams): Promise<number> {
		let deletedCount = 0;
		let failures = 0;
		const maxFailures = 1;

		while (failures < maxFailures) {
			const found = await waitForByScrolling(() => findCaret() !== null, 400, {
				maxWaitMs: 3000,
				intervalMs: 200
			});

			if (!found) {
				failures++;
				const prevScroll = window.scrollY;
				window.scrollTo(0, 0);
				await delay(400);

				if (window.scrollY === prevScroll) {
					postLog('info', 'No scroll change; assuming no more posts.');
					break;
				}
				continue;
			}

			const success = await clickDeleteOnPost(params.waitBetweenRetryDeleteAttempts);
			if (success) {
				deletedCount++;
				postProgress(params.requestId, deletedCount);
				failures = 0;
				await delay(params.waitAfterDelete);
			} else {
				failures++;
				await delay(300);
			}
		}

		return deletedCount;
	}
};
