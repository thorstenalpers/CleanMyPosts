import {
	clickWithCursor,
	delay,
	highlightElement,
	isVisible,
	postDebug,
	postLog,
	postMarkup,
	postProgress,
	waitForByScrolling
} from '../dom';
import { matchesAny, siteConfig } from '../config';
import type { RunParams } from '../protocol';
import type { DeleteActionDefinition } from '../types';

/**
 * The ⌄ on a post the signed-in user actually wrote.
 *
 * Taking the first caret on the page was wrong on a timeline that holds anything but plain
 * posts: a repost renders the *original* author's post, caret and all, and that menu has no
 * "Delete" in it — it has "Report post" and "Block". Opening it was at best a dead end and at
 * worst one click away from an action against someone else.
 *
 * A post counts as the user's when it links to their profile and carries no repost marker,
 * which is the same test `replies.ts` has always applied.
 */
function findOwnPostCaret(userName: string): Element | null {
	if (!userName) {
		// Without a handle there is nothing to compare against. The old behaviour — take the
		// first caret and hope — is exactly what this function exists to prevent.
		postLog('warning', 'No handle for the signed-in account; not touching any post menu.');
		return null;
	}

	for (const article of document.querySelectorAll(siteConfig.x.article)) {
		const byUser = article.querySelector(`a[href^="/${userName}"]`) !== null;
		const reposted = article.querySelector(siteConfig.x.unretweet) !== null;
		if (!byUser || reposted) continue;

		const caret = article.querySelector<HTMLElement>('button[data-testid="caret"]');
		if (caret) return caret;
	}
	return null;
}

async function tryClickDeleteMenuItem(): Promise<boolean> {
	const delays = [100, 200, 300, 500, 500, 500, 500, 500, 1000, 1000];

	for (const ms of delays) {
		await delay(ms);

		const menu = document.querySelector<HTMLElement>(siteConfig.x.menu);
		if (!menu || menu.style.display === 'none') continue;

		const items = [...menu.querySelectorAll(siteConfig.x.menuItem)];

		// The wording decides. Red used to decide on its own, and X paints more than one entry
		// red — "Report post" and "Block" among them — so on any post that was not the user's
		// own, the colour test could pick an action against somebody else.
		for (const item of items) {
			const span = item.querySelector('span');
			if (span && matchesAny(span.textContent ?? '', siteConfig.x.deleteMenuText)) {
				clickWithCursor(span);
				return true;
			}
		}

		// Only once the menu is fully there and still nothing matched: the user's language is
		// one this app has not been told about. Red narrows it down, but never on its own — the
		// entry has to be the only red one in the menu.
		if (items.length > 0) {
			const red = items.filter((item) => {
				const span = item.querySelector('span');
				return span ? isDestructiveRed(getComputedStyle(span).color) : false;
			});
			if (red.length === 1) {
				const span = red[0]?.querySelector('span');
				if (span) {
					postLog(
						'warning',
						`No known wording for "delete" in this menu; taking the only red entry: "${(span.textContent ?? '').trim()}"`
					);
					clickWithCursor(span);
					return true;
				}
			}
			postDebug(
				`Menu entries offered: ${items.map((i) => (i.textContent ?? '').trim()).join(' | ')}`
			);
			postMarkup('The post menu with no delete entry', menu);
		}
	}

	return false;
}

function isDestructiveRed(color: string): boolean {
	const [r, g, b] = color.match(/\d+/g)?.map(Number) ?? [];
	return r !== undefined && g !== undefined && b !== undefined && r > 180 && g < 100 && b < 100;
}

async function confirmDelete(): Promise<boolean> {
	const delays = [100, 200, 300, 500, 500, 500, 500, 500, 1000, 1000];

	for (const ms of delays) {
		await delay(ms);

		const confirmBtn = document.querySelector<HTMLButtonElement>(siteConfig.x.confirm);
		if (isVisible(confirmBtn)) {
			clickWithCursor(confirmBtn);
			return true;
		}
	}

	return false;
}

async function clickDeleteOnPost(
	waitBetweenRetryDeleteAttempts: number,
	userName: string
): Promise<boolean> {
	const caret = findOwnPostCaret(userName);
	if (!caret) return false;

	highlightElement(caret.closest('article') ?? (caret as HTMLElement));
	clickWithCursor(caret as HTMLElement);
	await delay(waitBetweenRetryDeleteAttempts);

	if (!(await tryClickDeleteMenuItem())) return false;
	return confirmDelete();
}

export const postsAction: DeleteActionDefinition = {
	isEmpty(): boolean {
		return document.querySelector(siteConfig.x.article) === null;
	},

	async run(params: RunParams): Promise<number> {
		let deletedCount = 0;
		let failures = 0;
		const maxFailures = 1;

		while (failures < maxFailures) {
			const found = await waitForByScrolling(
				() => findOwnPostCaret(params.userName ?? '') !== null,
				400,
				{
					maxWaitMs: 3000,
					intervalMs: 200
				}
			);

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

			const success = await clickDeleteOnPost(
				params.waitBetweenRetryDeleteAttempts,
				params.userName ?? ''
			);
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
