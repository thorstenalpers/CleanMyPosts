import { siteConfig } from './config';
import { clickWithCursor, isVisible, postLog } from './dom';

/**
 * Cookie banners, clicked away automatically.
 *
 * The banner is in the language the platform picked for the visitor, so the button is
 * matched by wording rather than by a selector — the same list of languages the app itself
 * is translated into. A declining button is always preferred; an accepting one is only used
 * where the banner offers nothing else, because the goal is to get the bar out of the way,
 * not to consent on the user's behalf.
 */

/** A candidate only counts inside a container that is recognisably about cookies. */
const CONSENT_CONTEXT =
	/cookie|consent|zustimm|einwillig|privatsphäre|confidentialité|témoins|privacidad|privacidade|informativa|クッキー|同意|куки|ملفات تعريف الارتباط|كوكيز|कुकी/i;

/**
 * Longer than this and the "banner" is the page itself, not a bar.
 *
 * YouTube's consent lightbox carries 2238 characters of it, which is what the old 1500
 * rejected — the buttons were found, the container around them never counted as a banner,
 * and nothing was ever clicked.
 */
const MAX_BANNER_TEXT = 4000;

const DECLINE =
	/\b(refuse|reject|decline|deny)\b|only necessary|only essential|ablehnen|nur notwendige|nur erforderliche|rechazar|denegar|solo (las )?necesarias|refuser|tout refuser|rifiuta|solo necessari|recusar|rejeitar|отклонить|отказаться|только необходимые|拒否|同意しない|拒绝|不同意|رفض|अस्वीकार/i;

const ACCEPT =
	/\b(accept|agree|allow|got it|okay|ok)\b|akzeptieren|zustimmen|einverstanden|verstanden|aceptar|acepto|de acuerdo|permitir|accepter|j'accepte|autoriser|d'accord|accetta|accetto|consenti|va bene|aceitar|aceito|concordo|принять|согласен|разрешить|хорошо|同意する|承諾|許可|接受|同意|允许|好的|确定|قبول|موافق|أوافق|स्वीकार|ठीक है|सहमत/i;

const CANDIDATE_SELECTOR = 'button, [role="button"], a[role="link"], input[type="button"]';

/** How far up from a button the banner may sit. */
const MAX_ANCESTOR_DEPTH = 8;

function label(el: Element): string {
	const text = el instanceof HTMLInputElement ? el.value : (el.textContent ?? '');
	return `${text} ${el.getAttribute('aria-label') ?? ''}`.trim();
}

function inConsentBanner(el: Element): boolean {
	// The button often says what it is about itself — YouTube labels its two with "the use of
	// cookies and other data". That survives a dialog growing past any length limit below.
	if (CONSENT_CONTEXT.test(el.getAttribute('aria-label') ?? '')) return true;

	let node: Element | null = el.parentElement;
	for (let depth = 0; node && depth < MAX_ANCESTOR_DEPTH; depth++, node = node.parentElement) {
		const text = node.textContent ?? '';
		if (text.length <= MAX_BANNER_TEXT && CONSENT_CONTEXT.test(text)) return true;
	}
	return false;
}

/** Clicks the first dismissing button of a visible cookie banner. True if one was clicked. */
export function dismissConsentBanner(): boolean {
	if (!siteConfig.autoConsent) return false;

	const candidates = [...document.querySelectorAll(CANDIDATE_SELECTOR)].filter(
		(el): el is HTMLElement => isVisible(el) && inConsentBanner(el)
	);

	for (const pattern of [DECLINE, ACCEPT]) {
		const match = candidates.find((el) => pattern.test(label(el)));
		if (match) {
			postLog('info', `Cookie banner dismissed: "${label(match).slice(0, 60)}"`);
			clickWithCursor(match);
			return true;
		}
	}

	return false;
}

const POLL_INTERVAL_MS = 500;
const MAX_WAIT_MS = 20000;

/**
 * Watches for a banner from page load until one is dismissed or the window closes.
 *
 * Polling rather than a MutationObserver: consent bars arrive late, animate in, and are
 * re-rendered while they do, and a poll survives all three without firing on every keystroke
 * the page makes elsewhere.
 */
export function startConsentWatcher(): void {
	const deadline = Date.now() + MAX_WAIT_MS;
	const timer = setInterval(() => {
		if (dismissConsentBanner() || Date.now() > deadline) clearInterval(timer);
	}, POLL_INTERVAL_MS);
}
