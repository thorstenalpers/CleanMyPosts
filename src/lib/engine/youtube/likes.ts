import {
	clickWithCursor,
	delay,
	highlightElement,
	postDebug,
	postLog,
	postMarkup,
	postProgress,
	pressEnter,
	waitForByScrolling
} from '../dom';
import { matchesAny, siteConfig } from '../config';
import type { RunParams } from '../protocol';
import type { DeleteActionDefinition } from '../types';

function matchesRemovePattern(text: string): boolean {
	return matchesAny(text, siteConfig.youtube.removeFromLikedText);
}

/**
 * The first entry still in the list that is worth trying.
 *
 * Always searched fresh: the list is virtualised, so a node collected on an earlier pass is
 * long gone. `hidden` and `is-dismissed` are how the old renderers marked a removed row; the
 * new view models simply leave the document, which `unlikeVideo` checks for instead.
 *
 * `skip` holds the ones YouTube took the removal for and left on screen anyway. Without it
 * this returns the same stuck row every pass, and a list of two hundred videos ends after the
 * first one that would not go.
 */
function findVideoItem(skip: ReadonlySet<string> = new Set()): HTMLElement | null {
	for (const item of document.querySelectorAll<HTMLElement>(siteConfig.youtube.videoItem)) {
		if (item.hasAttribute('is-dismissed') || item.hasAttribute('hidden')) continue;
		if (skip.has(videoIdOf(item))) continue;
		return item;
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

/**
 * The entries of whatever menu is open, if any.
 *
 * Scoped to `likesPopup` when that matches and to the whole document when it does not. The
 * container was the weak link: YouTube has three shapes for this menu and the wrapper is the
 * part that changes, so a wrapper nobody recognised made an open menu read as closed — and
 * that verdict is what sent a second click at the ⋮, which shut the menu that had just opened.
 * The entries are the thing worth asking about, and they are visible or they are not.
 */
function openMenuItems(): HTMLElement[] {
	const popup = document.querySelector(siteConfig.youtube.likesPopup);
	const scope: ParentElement = popup ?? document;
	return [...scope.querySelectorAll<HTMLElement>(siteConfig.youtube.likesPopupItem)].filter(
		(item) => item.getBoundingClientRect().height > 0
	);
}

function menuIsOpen(): boolean {
	return openMenuItems().length > 0;
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

const TITLE_SELECTORS = [
	'.ytListItemViewModelTitle',
	'.yt-list-item-view-model__title',
	'.yt-core-attributed-string',
	'yt-formatted-string',
	'[role="text"]'
];

function findRemoveMatch(items: HTMLElement[]): HTMLElement | null {
	for (const item of items) {
		const textEl = TITLE_SELECTORS.map((s) => item.querySelector(s)).find((el) => el !== null);
		const text = textEl?.textContent ?? item.textContent ?? '';
		if (matchesRemovePattern(text)) return item;
	}
	return null;
}

type ParentElement = Document | Element;

/**
 * Where the handler might be on a menu entry, most likely first.
 *
 * Which node actually listens differs between YouTube's shapes and is not readable from here,
 * so the entry itself is always the last resort. Deduplicated because one node can answer two
 * selectors: in the view model the `<button>` *is* the text wrapper.
 */
function removeTargets(match: HTMLElement): HTMLElement[] {
	const candidates = siteConfig.youtube.likesPopupClickTargets
		.map((selector) => match.querySelector<HTMLElement>(selector))
		.filter((el): el is HTMLElement => el !== null);
	return [...new Set([...candidates, match])];
}

/** Enough of an element to tell two candidates apart in a log line. */
function describe(el: HTMLElement): string {
	const cls = el.className.split(' ').filter(Boolean)[0];
	return el.tagName.toLowerCase() + (cls ? `.${cls}` : '');
}

interface Activation {
	what: string;
	run: () => void;
}

/**
 * Every way this entry can be told to fire, in order of likelihood.
 *
 * Plain click on every candidate first, then the keyboard, and the full mouse sequence last —
 * an order the logs argued for twice. Three nodes were clicked with that sequence and none
 * acted, while the menu shut the moment the first one landed. `pointerdown` opens that
 * sequence, this menu closes on it, and a menu that has closed cannot act on the `click` five
 * events later. So the cheapest event goes first and the one that dismisses the thing it is
 * aimed at goes last.
 */
function activations(match: HTMLElement): Activation[] {
	const targets = removeTargets(match);
	return [
		...targets.map((el) => ({
			what: `a plain click on ${describe(el)}`,
			run: () => clickWithCursor(el)
		})),
		{ what: `Enter on ${describe(match)}`, run: () => pressEnter(match) },
		...targets.map((el) => ({
			what: `a full mouse press on ${describe(el)}`,
			run: () => clickWithCursor(el, { pointerSequence: true })
		}))
	];
}

/**
 * @param attempt Which activation to use. The run's failure count, so each retry tries a
 * different one rather than repeating what just did nothing.
 */
async function clickRemoveFromLiked(attempt: number): Promise<boolean> {
	const delays = [200, 300, 400, 500, 600, 800, 1000, 1500];

	for (const ms of delays) {
		await delay(ms);

		// Whatever menu is up, in any of YouTube's three shapes. Which wrapper it is is not this
		// loop's business; that it holds an entry saying "remove from liked" is.
		const match = findRemoveMatch(openMenuItems());
		if (match) {
			const ways = activations(match);
			const way = ways[Math.min(attempt, ways.length - 1)];
			if (!way) return false;
			postLog('info', `Trying ${way.what} (${attempt + 1} of ${ways.length} ways to fire it).`);
			way.run();
			return true;
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
		document.querySelector(siteConfig.youtube.likesPopup) ??
			openMenuItems()[0]?.parentElement ??
			null
	);
	return false;
}

async function closeMenu(): Promise<void> {
	document.body.dispatchEvent(
		new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true })
	);
	await delay(200);
}

/**
 * Which video a row is showing, from the `content-id-<id>` class YouTube puts on it.
 *
 * The list is virtualised, so "the node left the document" is not the only way a removal
 * shows: the node can survive and be handed the next video instead. Same element, different
 * id, and the deletion did happen.
 */
function videoIdOf(item: HTMLElement): string {
	const host = item.querySelector('[class*="content-id-"]') ?? item;
	return /content-id-([\w-]+)/.exec(host.className)?.[1] ?? '';
}

async function unlikeVideo(item: HTMLElement, waitTime: number, attempt: number): Promise<boolean> {
	const id = videoIdOf(item);

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
		// The row was reused for the next video, which is this list's other way of saying gone.
		if (id && videoIdOf(item) !== id) return true;
	}

	// Not an error on its own — this list routinely keeps a row it has already dropped. The
	// caller decides what to make of it; see `run`.
	postLog('info', 'Asked for the removal; the row is still on screen.');
	return false;
}

export const youTubeLikesAction: DeleteActionDefinition = {
	isEmpty(): boolean {
		return findVideoItem() === null;
	},

	async run(params: RunParams): Promise<number> {
		let deletedCount = 0;
		let emptyPasses = 0;
		/** Which entry in `activations` to use. Only moves while nothing is working. */
		let way = 0;
		/** Removals seen to happen, as opposed to asked for. Zero of these ends the run. */
		let confirmed = 0;
		/**
		 * Videos YouTube accepted the removal for and left on screen anyway.
		 *
		 * Common enough to design around: the row stays until the page is loaded again, and
		 * retrying it is retrying something already done. They are stepped over so the rest of
		 * the list gets its turn, and the caller's reload is what clears them.
		 */
		const stuck = new Set<string>();

		/** More ways than `activations` can produce, so the index below always has one to give. */
		const maxWays = 7;

		while (emptyPasses < 3) {
			dismissSurveyBanner();

			const found = await waitForByScrolling(() => findVideoItem(stuck) !== null, 400, {
				maxWaitMs: 5000,
				intervalMs: 300
			});
			if (!found) {
				emptyPasses++;
				const prevScroll = window.scrollY;
				window.scrollBy(0, 500);
				await delay(500);

				if (window.scrollY === prevScroll) {
					// The end of the list, or a page whose markup this engine no longer recognises.
					// Those two used to look identical from the log.
					if (stuck.size === 0) reportNothingFound();
					break;
				}
				continue;
			}

			const item = findVideoItem(stuck);
			if (!item) continue;
			const id = videoIdOf(item);

			const went = await unlikeVideo(item, params.waitBetweenRetryDeleteAttempts, way);

			if (went) {
				confirmed++;
				// A way that just worked is the way. It only moves on while nothing at all does.
				way = 0;
			} else {
				// One try per video, then on to the next.
				//
				// A row that stayed is not evidence the click failed: YouTube leaves rows on screen
				// it has already removed, and they only go on the next page load. Six more attempts
				// would be six clicks at something already deleted, paid for with the rest of the
				// list. So it counts — the removal was asked for and the menu took it — and the
				// reload that follows is what settles whether it happened.
				stuck.add(id);
				way = Math.min(way + 1, maxWays - 1);

				// Nothing has visibly worked yet and every way has now been tried. At that point
				// the assumption above has nothing holding it up, so the run stops rather than
				// reporting a list of deletions it never saw.
				if (confirmed === 0 && stuck.size >= maxWays) {
					postLog('warning', 'Nothing visibly left the list. Stopping rather than guessing.');
					break;
				}
			}

			deletedCount++;
			postProgress(params.requestId, deletedCount);
			emptyPasses = 0;
			await closeMenu();
			await delay(params.waitAfterDelete);
		}

		if (stuck.size > 0) {
			postLog(
				'info',
				`${deletedCount} removed, ${stuck.size} of them still on screen — those go on the reload that follows.`
			);
		}

		// Nothing seen to go means nothing to report, whatever was asked for. Reporting the asks
		// would also have the caller reload and try again on the strength of them.
		return confirmed === 0 ? 0 : deletedCount;
	}
};
