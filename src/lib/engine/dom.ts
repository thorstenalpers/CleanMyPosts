import type { ContentMessage } from './protocol';

export function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/** True for an element that is rendered, laid out, and not disabled. */
export function isVisible(el: Element | null): el is HTMLElement {
	if (!el) return false;
	const htmlEl = el as HTMLElement;
	if ('disabled' in htmlEl && (htmlEl as HTMLButtonElement).disabled) return false;
	return htmlEl.offsetParent !== null || htmlEl.getClientRects().length > 0;
}

export interface WaitForOptions {
	maxWaitMs?: number;
	intervalMs?: number;
	/** Called on every unsuccessful tick, e.g. to scroll the page into view of new content. */
	onTick?: () => void;
}

/** Polls `check` until it returns a truthy value or `maxWaitMs` elapses. */
export async function waitFor<T>(
	check: () => T,
	options: WaitForOptions = {}
): Promise<T | undefined> {
	const { maxWaitMs = 5000, intervalMs = 200, onTick } = options;
	const start = Date.now();

	while (true) {
		const result = check();
		if (result) return result;

		if (Date.now() - start >= maxWaitMs) return undefined;

		onTick?.();
		await delay(intervalMs);
	}
}

/** `waitFor` with a `window.scrollBy` side effect — the common "load more by scrolling" pattern. */
export function waitForByScrolling<T>(
	check: () => T,
	scrollBy = 500,
	options: Omit<WaitForOptions, 'onTick'> = {}
): Promise<T | undefined> {
	return waitFor(check, { ...options, onTick: () => window.scrollBy(0, scrollBy) });
}

let cursorEl: HTMLElement | null = null;
let rippleEl: HTMLElement | null = null;

/**
 * The pointer the user watches while the app clicks.
 *
 * A broom, drawn as inline SVG rather than loaded as an image: no asset means no
 * `web_accessible_resources` entry in the extension and nothing for a store review to ask
 * about, and it stays sharp at any zoom. `pointer-events:none` keeps it out of the way of the
 * clicks it reports.
 */
const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Black, and legible on a black page.
 *
 * Both platforms have a dark mode, where black on its own is a hole in the screen. The white
 * head and the halo in `ensureCursor` are what make it a shape there — a drop-shadow rather
 * than a second set of SVG nodes, so it costs the compositor one filter and the DOM nothing.
 */
const CURSOR_INK = '#000';

/**
 * Built node by node rather than from a string of markup.
 *
 * YouTube ships `require-trusted-types-for 'script'`, and under that policy any assignment to
 * `innerHTML` throws — which took the whole run down before the first item was deleted, with
 * "This document requires 'TrustedHTML' assignment" as the only clue.
 */
/**
 * Lucide's `broom-sparkles`, as path data.
 *
 * The paths rather than the component: this draws into a foreign document with no Svelte and
 * no bundler around it. Kept in step with the package by hand, which is the price of the
 * engine being able to run anywhere — `@lucide/svelte` is where they came from and where a
 * corrected version would come from.
 *
 * The head is the one closed path and is the one that gets filled.
 */
const BROOM_PATHS = [
	'M11 2v2',
	'M12 3h-2',
	'M13.5 10.5 22 2',
	'M14.734 13.841a2 2 0 00-.314-2.42L12.58 9.58a2 2 0 00-2.421-.314l-7.657 4.461A1 1 0 002.3 15.3l6.403 6.403a1 1 0 001.571-.204z',
	'M20 15v4',
	'M22 17h-4',
	'M4 4v4',
	'm5 18 2-2',
	'M6 6H2',
	'm7.699 10.7 5.602 5.601'
];

function buildCursorSvg(): SVGSVGElement {
	const svg = document.createElementNS(SVG_NS, 'svg');
	svg.setAttribute('width', '32');
	svg.setAttribute('height', '32');
	svg.setAttribute('viewBox', '0 0 24 24');
	svg.setAttribute('fill', 'none');
	svg.setAttribute('stroke', CURSOR_INK);
	svg.setAttribute('stroke-width', '2');
	svg.setAttribute('stroke-linecap', 'round');
	svg.setAttribute('stroke-linejoin', 'round');

	for (const d of BROOM_PATHS) {
		const path = document.createElementNS(SVG_NS, 'path');
		path.setAttribute('d', d);
		// The head is the one closed shape, and filling it white is what keeps the whole thing
		// readable on a dark timeline — black on black is a hole, outline or not.
		if (d.endsWith('z')) path.setAttribute('fill', '#fff');
		svg.append(path);
	}

	return svg;
}

function ensureCursor(): HTMLElement {
	if (cursorEl && document.body.contains(cursorEl)) return cursorEl;
	cursorEl = document.createElement('div');
	cursorEl.append(buildCursorSvg());
	// Anchored on the head, not the middle: a broom sweeps what it stands on, so the head sits
	// over the thing being clicked and the handle points up and away from it. The head of this
	// icon is the lower-left corner of the box, around (8, 16) of its 24 — hence the offsets.
	cursorEl.style.cssText =
		'position:fixed;z-index:2147483647;pointer-events:none;line-height:0;opacity:1;' +
		'transform:translate(-11px,-21px);transition:left .2s ease,top .2s ease,opacity .3s ease;' +
		'filter:drop-shadow(0 0 2px rgba(255,255,255,.95)) drop-shadow(0 1px 3px rgba(0,0,0,.4));';
	document.body.appendChild(cursorEl);
	return cursorEl;
}

/** Lives as long as the cursor does, for the same reason: one node, not one per click. */
function ensureRipple(): HTMLElement {
	if (rippleEl && document.body.contains(rippleEl)) return rippleEl;
	rippleEl = document.createElement('div');
	rippleEl.style.cssText =
		'position:fixed;z-index:2147483646;pointer-events:none;opacity:0;' +
		'width:20px;height:20px;margin:-10px 0 0 -10px;border:3px solid #000;border-radius:50%;' +
		'background:rgba(0,0,0,.18);box-shadow:0 0 0 1px rgba(255,255,255,.9);';
	document.body.appendChild(rippleEl);
	return rippleEl;
}

/**
 * Takes the pointer off the page.
 *
 * Called when a run ends, whatever the outcome: a marker left behind reads as "still
 * working" long after nothing is, and it is the only thing this app draws on top of a page
 * it does not own.
 */
export function hideCursor(): void {
	rippleEl?.remove();
	rippleEl = null;
	if (!cursorEl) return;
	const el = cursorEl;
	cursorEl = null;
	el.style.opacity = '0';
	setTimeout(() => el.remove(), 300);
}

/** Briefly outlines an element so the user can see which item (post, video, …) is being deleted. */
export function highlightElement(el: HTMLElement, durationMs = 1500): void {
	const prevOutline = el.style.outline;
	const prevOffset = el.style.outlineOffset;
	const prevBackground = el.style.backgroundColor;
	el.style.outline = '3px solid #ff3b30';
	el.style.outlineOffset = '-3px';
	el.style.backgroundColor = 'rgba(255,59,48,.08)';
	setTimeout(() => {
		if (!document.contains(el)) return;
		el.style.outline = prevOutline;
		el.style.outlineOffset = prevOffset;
		el.style.backgroundColor = prevBackground;
	}, durationMs);
}

export interface ClickOptions {
	/**
	 * Send the full mouse sequence instead of a bare `click`.
	 *
	 * Needed by YouTube's newer menu entries, which commit on `pointerup`. Not wanted on a
	 * button that toggles: those act on `pointerdown` *and* on `click`, so sending both opened
	 * the menu and shut it again in one go — "the menu flashes and nothing happens".
	 */
	pointerSequence?: boolean;
}

/** Clicks `el` after moving a visible pointer marker + ripple to its centre, so the user can follow the automation. */
export function clickWithCursor(el: HTMLElement, options: ClickOptions = {}): void {
	const rect = el.getBoundingClientRect();
	const x = rect.left + rect.width / 2;
	const y = rect.top + rect.height / 2;

	const cursor = ensureCursor();
	cursor.style.left = `${x}px`;
	cursor.style.top = `${y}px`;

	const ripple = ensureRipple();
	// Restarted rather than rebuilt. Appending a node and removing it 450ms later put two body
	// mutations inside the window where a menu this engine had just opened was supposed to stay
	// open, and a platform that watches its own subtree gets to react to both.
	ripple.style.transition = 'none';
	ripple.style.left = `${x}px`;
	ripple.style.top = `${y}px`;
	ripple.style.transform = 'scale(1)';
	ripple.style.opacity = '1';
	requestAnimationFrame(() => {
		ripple.style.transition = 'transform .4s ease,opacity .4s ease';
		ripple.style.transform = 'scale(2.4)';
		ripple.style.opacity = '0';
	});

	if (options.pointerSequence) dispatchRealClick(el, x, y);
	else el.click();
}

/**
 * Activates an element the way a keyboard does.
 *
 * A different path entirely, not another guess at which node listens: where every node in a
 * menu entry has been clicked and the entry did nothing, the handler is not on a pointer event
 * at all. `role="menuitem"` entries answer Enter, and focus is what makes that reach them.
 */
export function pressEnter(el: HTMLElement): void {
	el.focus();
	const init = {
		key: 'Enter',
		code: 'Enter',
		keyCode: 13,
		which: 13,
		bubbles: true,
		cancelable: true,
		composed: true
	};
	for (const type of ['keydown', 'keypress', 'keyup']) {
		el.dispatchEvent(new KeyboardEvent(type, init));
	}
}

/**
 * The whole sequence a mouse produces, ending in `click`.
 *
 * `el.click()` alone fires one event and nothing else, which YouTube's view-model menu
 * entries ignore — they commit on `pointerup`. Reserved for those: on a toggle, the extra
 * `pointerdown` counts as a second activation and closes what the click just opened.
 */
function dispatchRealClick(el: HTMLElement, x: number, y: number): void {
	const base = { bubbles: true, cancelable: true, composed: true, clientX: x, clientY: y };
	const pointer = { ...base, pointerId: 1, pointerType: 'mouse', isPrimary: true };

	el.dispatchEvent(new PointerEvent('pointerover', pointer));
	el.dispatchEvent(new PointerEvent('pointerenter', pointer));
	el.dispatchEvent(new MouseEvent('mouseover', base));
	el.dispatchEvent(new PointerEvent('pointerdown', { ...pointer, button: 0, buttons: 1 }));
	el.dispatchEvent(new MouseEvent('mousedown', { ...base, button: 0, buttons: 1 }));
	el.dispatchEvent(new PointerEvent('pointerup', { ...pointer, button: 0, buttons: 0 }));
	el.dispatchEvent(new MouseEvent('mouseup', { ...base, button: 0, buttons: 0 }));
	el.click();
}

let toastEl: HTMLElement | null = null;

/**
 * A result, shown on the platform page itself.
 *
 * The app's own toasts cannot reach here: the site runs in its own webview, painted over the
 * window by the compositor, and nothing the Svelte app draws can sit on top of it. While a
 * platform is showing, the chrome owns only the sidebar column and a 44px strip — a toast in
 * either is clipped. So the engine draws this one, in the page, where there is room.
 *
 * Built with `textContent` and inline styles: this page may enforce Trusted Types.
 */
export function showToast(message: string, kind: 'success' | 'info' | 'error' = 'info'): void {
	toastEl?.remove();

	const accent = kind === 'error' ? '#e5484d' : kind === 'success' ? '#30a46c' : '#0090ff';

	// Sonner's shape, since that is what the rest of the app shows: a light card with a hair
	// of a border, a soft shadow, and a coloured dot rather than a bar. Written out in full
	// rather than inherited — this element lives in someone else's stylesheet.
	const el = document.createElement('div');
	el.style.cssText =
		'position:fixed;top:16px;right:16px;z-index:2147483647;pointer-events:none;' +
		'display:flex;align-items:center;gap:10px;max-width:380px;padding:12px 16px;' +
		'border-radius:8px;border:1px solid rgba(0,0,0,.08);background:#fff;color:#171717;' +
		'font:500 13px/1.4 system-ui,-apple-system,"Segoe UI",sans-serif;opacity:0;' +
		'box-shadow:0 4px 12px rgba(0,0,0,.1);transform:translateY(-8px);' +
		'transition:opacity .25s ease,transform .25s ease;';

	const dot = document.createElement('span');
	dot.style.cssText = `flex:0 0 auto;width:8px;height:8px;border-radius:50%;background:${accent};`;

	const text = document.createElement('span');
	text.textContent = message;

	el.append(dot, text);
	document.body.appendChild(el);
	toastEl = el;

	requestAnimationFrame(() => {
		el.style.opacity = '1';
		el.style.transform = 'none';
	});

	setTimeout(() => {
		el.style.opacity = '0';
		setTimeout(() => {
			el.remove();
			if (toastEl === el) toastEl = null;
		}, 250);
	}, 5000);
}

let shieldEl: HTMLElement | null = null;
let shieldAbort: AbortController | null = null;

/**
 * Everything a person can do to a page, caught before the page hears about it.
 *
 * The pointer events are in here even though the overlay already covers them, and that is the
 * point: an overlay only works for as long as it is in the DOM, and it is one `<div>` sitting
 * in a body that a platform re-renders on its own schedule. Nothing in this list depends on it
 * — the overlay is now only what makes the block visible, and `cursor:not-allowed` is the
 * whole of its job.
 */
const SHIELDED_EVENTS = [
	'pointerdown',
	'pointerup',
	'mousedown',
	'mouseup',
	'click',
	'auxclick',
	'dblclick',
	'keydown',
	'keypress',
	'keyup',
	'wheel',
	'touchstart',
	'touchmove',
	'contextmenu',
	'submit'
] as const;

/**
 * The user's hand, told apart from the engine's.
 *
 * `isTrusted` is the whole distinction and it cannot be forged: the browser sets it on what a
 * person did, and everything the engine sends — the mouse sequence in `clickWithCursor`, the
 * Escape that closes a YouTube menu — is constructed, so it reads false and passes through.
 * A blanket block here would stop the run it is meant to protect.
 */
function swallow(event: Event): void {
	if (!event.isTrusted) return;
	event.preventDefault();
	event.stopImmediatePropagation();
}

/**
 * Takes the page away from the user for the length of a run.
 *
 * The engine works by clicking the platform's own controls, and a second hand on the page
 * fights it: a click on the platform's navigation mid-run leaves the list being emptied, and
 * the run then deletes nothing and says the account is clean. A user cannot be expected to
 * know that, so the page stops taking input instead of asking them not to.
 *
 * This used to be the overlay alone, and that was the bug: a `<div>` in someone else's body
 * is theirs to remove, and X re-renders around it whenever it likes. The listeners are the
 * block now — they are on `window`, in the capture phase, and there is nothing in the page
 * for a platform to take away. The overlay stays for the one thing it is actually good at,
 * which is saying so: `cursor:not-allowed` under the pointer.
 *
 * Not covered: what the browser owns above the page. F5 and the back gesture are its keys,
 * not the document's.
 */
export function showShield(): void {
	if (!shieldAbort) {
		shieldAbort = new AbortController();
		for (const type of SHIELDED_EVENTS) {
			// `passive: false` or the wheel is not ours to cancel — Chromium assumes otherwise
			// for scroll events bound this high up.
			window.addEventListener(type, swallow, {
				capture: true,
				passive: false,
				signal: shieldAbort.signal
			});
		}
	}

	// Rebuilt whenever the page has since dropped it. Second, and never in the way of the
	// listeners above: a body that is not there yet must not cost a run its block.
	if (shieldEl && document.body.contains(shieldEl)) return;
	const el = document.createElement('div');
	el.style.cssText =
		'position:fixed;inset:0;z-index:2147483646;cursor:not-allowed;background:transparent;';
	document.body.appendChild(el);
	shieldEl = el;
}

/** Gives the page back. Called when a run ends, whatever the outcome. */
export function hideShield(): void {
	shieldEl?.remove();
	shieldEl = null;
	shieldAbort?.abort();
	shieldAbort = null;
}

type Transport = (message: ContentMessage) => void;

let transport: Transport | null = null;

/**
 * Sends the reports somewhere other than WebView2 — the browser extension routes them
 * through `chrome.runtime` instead, since a content script has no host webview to post to.
 */
export function setTransport(next: Transport): void {
	transport = next;
}

/**
 * The one way out of the page.
 *
 * Inside the app that is the WebView2 bridge. Outside it — a standalone script pasted into a
 * browser console, which is how somebody without Windows uses this — there is no bridge, and
 * a run that reported nothing would look like a run that did nothing. The console is the only
 * surface left there, so it gets the same lines.
 */
function post(message: ContentMessage): void {
	if (transport) {
		transport(message);
		return;
	}
	const bridge = window.chrome?.webview;
	if (bridge) {
		bridge.postMessage(message);
		return;
	}
	if (message.type === 'log') console.log(`[CleanMyPosts] ${message.message}`);
	else if (message.type === 'progress')
		console.log(`[CleanMyPosts] ${message.deletedCount} removed`);
	else if (message.type === 'error') console.error(`[CleanMyPosts] ${message.message}`);
}

export function postLog(level: 'debug' | 'info' | 'warning' | 'error', message: string): void {
	post({ type: 'log', level, message });
}

/** Answers a question that came back with text rather than a count. */
export function postProbe(requestId: string, payload: string): void {
	post({ type: 'probe', requestId, payload });
}

export function postProbeError(requestId: string, error: string): void {
	post({ type: 'probe', requestId, error });
}

/**
 * Detail for when something goes wrong in a way the normal lines cannot explain — which
 * entries a menu offered, what a page answered with. Sent regardless; the host drops it
 * unless the user turned diagnostics up, so the decision lives in one place rather than in
 * every call site.
 */
export function postDebug(message: string): void {
	post({ type: 'log', level: 'debug', message });
}

/** As much markup as is worth carrying through a log line. */
const MARKUP_LIMIT = 4000;

/**
 * The markup a selector failed against.
 *
 * A selector that finds nothing is the one failure this app cannot reason about from the
 * outside: the log says "nothing found" and the page that would explain it is gone by the
 * time anyone reads the line. This carries the element itself — trimmed, because a YouTube
 * container runs to hundreds of kilobytes and a log is not an archive.
 *
 * Only ever at `debug` level, and the host drops that unless the user asked for it: this is
 * the one place where a platform page's own content can reach the log.
 */
export function postMarkup(what: string, element: Element | null): void {
	if (!element) {
		postDebug(`${what}: nothing on the page to show.`);
		return;
	}
	const html = element.outerHTML;
	const shown =
		html.length > MARKUP_LIMIT
			? `${html.slice(0, MARKUP_LIMIT)}… (+${html.length - MARKUP_LIMIT} chars)`
			: html;
	postDebug(`${what}:\n${shown}`);
}

export function postProgress(requestId: string, deletedCount: number, message?: string): void {
	post({ type: 'progress', requestId, deletedCount, message });
}

export function postDone(requestId: string, deletedCount: number): void {
	post({ type: 'done', requestId, deletedCount });
}

/** Resolves the host's pending call with a failure instead of leaving it hanging. */
export function postError(requestId: string, message: string): void {
	post({ type: 'error', requestId, message });
}
