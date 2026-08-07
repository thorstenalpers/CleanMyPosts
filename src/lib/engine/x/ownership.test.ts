import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { postsAction } from './posts';

function markVisible(el: HTMLElement): void {
	el.getClientRects = () => [{} as DOMRect] as unknown as DOMRectList;
}

/**
 * A timeline as X actually renders one: above the user's own post sits a repost, which shows
 * the *original* author's article — caret and all.
 *
 * Taking the first caret on the page therefore opened a stranger's menu. That menu holds no
 * "Delete"; it holds "Report post" and "Block", which is what makes this more than a dead
 * end.
 */
function timelineWithARepostOnTop(handle: string): { own: HTMLElement; stranger: HTMLElement } {
	document.body.innerHTML = `
		<div data-testid="primaryColumn"><section>
			<article data-testid="tweet" id="reposted">
				<a href="/someoneelse">Someone Else</a>
				<button data-testid="unretweet">Undo repost</button>
				<button data-testid="caret">More</button>
			</article>
			<article data-testid="tweet" id="own">
				<a href="/${handle}">${handle}</a>
				<button data-testid="caret">More</button>
			</article>
		</section></div>
		<div role="menu">
			<div role="menuitem"><span style="color: rgb(244, 33, 46)">Delete</span></div>
		</div>
		<button data-testid="confirmationSheetConfirm">Delete</button>`;

	const own = document.querySelector<HTMLElement>('#own button[data-testid="caret"]')!;
	const stranger = document.querySelector<HTMLElement>('#reposted button[data-testid="caret"]')!;
	const confirm = document.querySelector<HTMLElement>(
		'button[data-testid="confirmationSheetConfirm"]'
	)!;
	markVisible(confirm);
	markVisible(document.querySelector<HTMLElement>("[role='menuitem'] span")!);

	// Confirming takes the post off the page, the way the real one goes.
	confirm.addEventListener('click', () => document.querySelector('#own')?.remove());

	return { own, stranger };
}

describe('which post the engine is willing to open a menu on', () => {
	beforeEach(() => {
		window.chrome = {
			webview: { postMessage: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn() }
		};
	});

	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('passes over a repost and takes the user’s own post', async () => {
		const { own, stranger } = timelineWithARepostOnTop('thorsten');
		const clicked: Element[] = [];
		for (const button of document.querySelectorAll('button')) {
			button.addEventListener('click', () => clicked.push(button));
		}

		await postsAction.run({
			requestId: 'r1',
			waitAfterDelete: 0,
			waitBetweenRetryDeleteAttempts: 0,
			userName: 'thorsten'
		});

		expect(clicked).toContain(own);
		expect(clicked).not.toContain(stranger);
	});

	// Without a handle there is nothing to compare against, and guessing is what caused this.
	it('touches nothing at all when the handle is unknown', async () => {
		timelineWithARepostOnTop('thorsten');
		const clicked: Element[] = [];
		for (const button of document.querySelectorAll('button')) {
			button.addEventListener('click', () => clicked.push(button));
		}

		const deleted = await postsAction.run({
			requestId: 'r2',
			waitAfterDelete: 0,
			waitBetweenRetryDeleteAttempts: 0,
			userName: ''
		});

		expect(clicked).toHaveLength(0);
		expect(deleted).toBe(0);
	});
});
