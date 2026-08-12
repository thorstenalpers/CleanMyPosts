import {
	clickWithCursor,
	delay,
	highlightElement,
	postDebug,
	postLog,
	postMarkup,
	postProgress,
	waitForByScrolling
} from '../dom';
import { matchesAny, siteConfig } from '../config';
import type { RunParams } from '../protocol';
import type { DeleteActionDefinition } from '../types';

function matchesRemovePattern(text: string): boolean {
	return matchesAny(text, siteConfig.youtube.removeFromLikedText);
}

/**
 * The first entry still in the list.
 *
 * Always searched fresh: the list is virtualised, so a node collected on an earlier pass is
 * long gone. `hidden` and `is-dismissed` are how the old renderers marked a removed row; the
 * new view models simply leave the document, which `unlikeVideo` checks for instead.
 */
function findVideoItem(): HTMLElement | null {
	for (const item of document.querySelectorAll<HTMLElement>(siteConfig.youtube.videoItem)) {
		if (!item.hasAttribute('is-dismissed') && !item.hasAttribute('hidden')) return item;
	}
	return null;
}

/**
 * Why nothing was found — the line that used to be missing.
 *
 * "No videos" and "the markup moved" ended the run the same silent way, and from the log
 * there was no telling which had happened. Naming the components actually on the page is
 * what a patch for `config.youtube.videoItem` gets written from.
 */
function reportNothingFound(): void {
	const seen = new Map<string, number>();
	for (const el of document.querySelectorAll(
		'[class*="LockupViewModel"], [class*="ViewModel"], [id="contents"] > *'
	)) {
		const name = el.tagName.toLowerCase();
		seen.set(name, (seen.get(name) ?? 0) + 1);
	}
	const summary = [...seen.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, 6)
		.map(([name, count]) => `${name} ×${count}`)
		.join(', ');

	postLog(
		'warning',
		summary
			? `No liked video matched "${siteConfig.youtube.videoItem}". The list holds: ${summary}`
			: 'No liked video found, and the list is empty — nothing left to remove.'
	);
	postMarkup(
		'The list the selector ran against',
		document.querySelector('#contents') ?? document.body
	);
}

/** A Google feedback/survey dialog can pop up mid-run and, being modal, blocks the next click. */
function dismissSurveyBanner(): void {
	const closeBtn = document.querySelector<HTMLElement>(siteConfig.youtube.closeDialog);
	if (closeBtn && closeBtn.getBoundingClientRect().width > 0) {
		clickWithCursor(closeBtn);
	}
}

/**
 * The ⋮ on an entry.
 *
 * By class rather than by `aria-label`: the label is translated — "Mehr Aktionen", "More
 * actions", "Más acciones" — and matching on fragments of it meant carrying a word list for
 * a button that has a perfectly stable class name.
 */
function findMenuButton(videoItem: HTMLElement): HTMLElement | null {
	return (
		videoItem.querySelector<HTMLElement>(siteConfig.youtube.itemMenu) ??
		videoItem.querySelector<HTMLElement>('button[aria-label]')
	);
}

/** Whether a menu is open, judged by it actually holding entries. */
function menuIsOpen(): boolean {
	const popup = document.querySelector(siteConfig.youtube.likesPopup);
	return popup !== null && popup.querySelector(siteConfig.youtube.likesPopupItem) !== null;
}

/**
 * Opens the ⋮ menu, and makes sure it stayed open.
 *
 * The button is nested — `div › button-view-model › button` — and a click on the inner one
 * bubbles. Where both levels act on it, the menu opens and closes in the same breath: "the
 * submenu flashes and the click lands on nothing". Which level is the live one is not
 * knowable from here, so the outcome decides: if the plain click left no menu behind, the
 * full pointer sequence gets a turn, and vice versa.
 */
async function clickMenuButton(videoItem: HTMLElement, waitTime: number): Promise<boolean> {
	const menuButton = findMenuButton(videoItem);
	if (!menuButton) {
		const buttons = [...videoItem.querySelectorAll('button')]
			.map((button) => button.getAttribute('aria-label') ?? '(no label)')
			.slice(0, 6)
			.join(' | ');
		postLog(
			'warning',
			`No menu button on <${videoItem.tagName.toLowerCase()}>. It offers: ${buttons}`
		);
		postMarkup('The row without a menu button', videoItem);
		return false;
	}

	// A moment to settle in either case: these menus animate in, and `waitTime` is the same
	// brake the settings already govern.
	clickWithCursor(menuButton);
	await delay(waitTime);
	if (menuIsOpen()) return true;

	postDebug('The menu did not stay open on a plain click; trying the full pointer sequence.');
	clickWithCursor(menuButton, { pointerSequence: true });
	await delay(waitTime);
	if (menuIsOpen()) return true;

	postLog(
		'warning',
		'The ⋮ menu would not stay open — neither a click nor a full mouse press opened it.'
	);
	postMarkup('The row whose menu would not open', videoItem);
	return false;
}

function findRemoveMatch(
	container: ParentElement,
	itemSelector: string,
	textSelectors: string[]
): HTMLElement | null {
	for (const item of container.querySelectorAll<HTMLElement>(itemSelector)) {
		const textEl = textSelectors.map((s) => item.querySelector(s)).find((el) => el !== null);
		const text = textEl?.textContent ?? item.textContent ?? '';
		if (matchesRemovePattern(text)) return item;
	}
	return null;
}

type ParentElement = Document | Element;

/**
 * Where the handler might be on a menu entry, most likely first.
 *
 * Which node actually listens differs between YouTube's shapes and is not readable from here:
 * the view model puts it on an inner button, the old renderer on the `tp-yt-paper-item`, and
 * the shorts sheet on the entry itself. Guessing once and reporting success is what left three
 * identical attempts clicking the same wrong node three times.
 */
function removeTargets(match: HTMLElement): HTMLElement[] {
	const candidates = [
		match.querySelector<HTMLElement>('button'),
		match.querySelector<HTMLElement>('.ytListItemViewModelTextWrapper'),
		match.querySelector<HTMLElement>('tp-yt-paper-item'),
		match
	].filter((el): el is HTMLElement => el !== null);
	return [...new Set(candidates)];
}

/** Enough of an element to tell two candidates apart in a log line. */
function describe(el: HTMLElement): string {
	const cls = el.className.split(' ').filter(Boolean)[0];
	return el.tagName.toLowerCase() + (cls ? `.${cls}` : '');
}

/**
 * @param attempt Which candidate to click. The run's failure count, so each retry tries a
 * different node rather than repeating the one that just did nothing.
 */
async function clickRemoveFromLiked(attempt: number): Promise<boolean> {
	const delays = [200, 300, 400, 500, 600, 800, 1000, 1500];

	for (const ms of delays) {
		await delay(ms);

		// One popup selector for all of YouTube's shapes — the old renderer, the new view model
		// and the sheet the shorts player uses. Which one is on screen is not this loop's
		// business; that it holds an entry saying "remove from liked" is.
		const popup = document.querySelector(siteConfig.youtube.likesPopup);
		if (popup) {
			const match = findRemoveMatch(popup, siteConfig.youtube.likesPopupItem, [
				'.ytListItemViewModelTitle',
				'.yt-list-item-view-model__title',
				'.yt-core-attributed-string',
				'yt-formatted-string',
				'[role="text"]'
			]);
			if (match) {
				const targets = removeTargets(match);
				const target = targets[Math.min(attempt, targets.length - 1)] ?? match;
				// The full mouse sequence: these entries commit on `pointerup` and ignore a bare
				// click. Which node hears it is what `attempt` walks through.
				postLog(
					'info',
					`Clicking "${describe(target)}" (${attempt + 1} of ${targets.length} places the handler could be).`
				);
				clickWithCursor(target, { pointerSequence: true });
				return true;
			}
		}
	}

	// Nothing matched in any of the three shapes. The wording is what decides here, so it is
	// the wording that goes into the log — that is the line a patch is written from.
	const seen = [...document.querySelectorAll<HTMLElement>(siteConfig.youtube.likesPopupItem)]
		.map((item) => (item.textContent ?? '').trim().replace(/\s+/g, ' '))
		.filter(Boolean)
		.slice(0, 8);

	postLog(
		'warning',
		seen.length > 0
			? `No "remove from liked" entry among: ${seen.join(' | ')}`
			: 'The item menu never opened — nothing to click.'
	);
	postMarkup(
		'The menu that held no remove entry',
		document.querySelector(siteConfig.youtube.likesPopup)
	);
	return false;
}

async function closeMenu(): Promise<void> {
	document.body.dispatchEvent(
		new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true })
	);
	await delay(200);
}

async function unlikeVideo(waitTime: number, attempt: number): Promise<boolean> {
	const item = findVideoItem();
	if (!item) return false;

	highlightElement(item);
	if (!(await clickMenuButton(item, waitTime))) return false;

	if (!(await clickRemoveFromLiked(attempt))) {
		await closeMenu();
		return false;
	}

	await delay(500);

	// The item has to actually go. Reporting success regardless — which is what this loop used
	// to do once the waits ran out — turned a menu entry that never took the click into an
	// endless run against the same video, counting one deletion per pass.
	const waitDelays = [200, 300, 500, 700, 1000, 1500];
	for (const ms of waitDelays) {
		await delay(ms);
		if (!document.contains(item)) return true;
		if (item.hasAttribute('is-dismissed') || item.hasAttribute('hidden')) return true;
	}

	postLog('warning', 'Clicked "remove from liked", but the video is still in the list.');
	return false;
}

export const youTubeLikesAction: DeleteActionDefinition = {
	isEmpty(): boolean {
		return findVideoItem() === null;
	},

	async run(params: RunParams): Promise<number> {
		let deletedCount = 0;
		let failures = 0;
		const maxFailures = 3;

		while (failures < maxFailures) {
			dismissSurveyBanner();

			const found = await waitForByScrolling(() => findVideoItem() !== null, 400, {
				maxWaitMs: 5000,
				intervalMs: 300
			});
			if (!found) {
				failures++;
				const prevScroll = window.scrollY;
				window.scrollBy(0, 500);
				await delay(500);

				if (window.scrollY === prevScroll) {
					// The end of the list, or a page whose markup this engine no longer recognises.
					// Those two used to look identical from the log.
					reportNothingFound();
					break;
				}
				continue;
			}

			const success = await unlikeVideo(params.waitBetweenRetryDeleteAttempts, failures);
			if (success) {
				deletedCount++;
				postProgress(params.requestId, deletedCount);
				failures = 0;
				await delay(params.waitAfterDelete);
			} else {
				failures++;
				postLog('info', `Attempt ${failures} of ${maxFailures} left this video in place.`);
				await closeMenu();
				await delay(500);
			}
		}

		return deletedCount;
	}
};
