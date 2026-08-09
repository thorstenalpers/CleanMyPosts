/**
 * A skeleton of the platform page, for the assistant to write a selector against.
 *
 * This is the one thing the app sends that comes off the page itself, so what it leaves out
 * matters more than what it keeps. The rule is the difference between *chrome* and *content*:
 * the words on a button belong to the platform and are exactly what a selector matches, while
 * the words in a post belong to the user and are none of a model's business.
 *
 * Kept: tag names, `data-testid`, roles, ids, class lists, the state attributes that decide
 * whether a control is live, and the short label of an interactive element.
 *
 * Dropped: every text node that is not such a label, every `href` and `src`, anything that
 * looks like a handle, an address, an email or a long opaque id, and any attribute not on the
 * list below. A value that survives all of that is still cut to length — a label is a few
 * words, and anything longer is prose that wandered into a button.
 */

/** Attributes a selector is actually built from. Everything else is dropped unread. */
const KEPT_ATTRIBUTES = [
	'data-testid',
	'role',
	'id',
	'type',
	'aria-pressed',
	'aria-expanded',
	'aria-checked',
	'aria-disabled',
	'disabled',
	'hidden'
] as const;

/** Elements whose own label is chrome rather than content, so it may travel. */
const LABELLED = 'a,button,summary,label,option,[role="button"],[role="menuitem"],[role="link"]';

const SKIPPED_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'SVG', 'PATH', 'IMG']);

/** Past this a label is not a label. */
const MAX_LABEL = 60;
const MAX_CLASSES = 4;
const MAX_DEPTH = 14;
/** What the prompt can carry without crowding out everything else in it. */
const MAX_CHARS = 24000;

/**
 * Anything that identifies a person or a thing rather than describing a control.
 *
 * Deliberately blunt. A label that trips any of these is dropped whole rather than patched:
 * a half-redacted string is a string someone has to check, and nobody checks it.
 */
const IDENTIFYING = [
	/@\w/, // a handle, anywhere in the string
	/https?:\/\//i,
	/\w+@\w+\.\w/, // an email
	/\d{6,}/, // an id, a timestamp, a count that is really an id
	/[0-9a-f]{16,}/i // a token or a hash
];

function isRedactable(value: string): boolean {
	return IDENTIFYING.some((pattern) => pattern.test(value));
}

/** A label only if it is short, chrome, and names nobody. */
function labelOf(el: Element): string | undefined {
	if (!el.matches(LABELLED)) return undefined;
	const text = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
	if (text === '' || text.length > MAX_LABEL || isRedactable(text)) return undefined;
	return text;
}

/**
 * `aria-label` is how both platforms name an icon-only control, so it is worth as much as the
 * visible label — and carries the same risk, X wording its reply button after the account
 * being replied to. Same test, same all-or-nothing answer.
 */
function ariaLabelOf(el: Element): string | undefined {
	const value = el.getAttribute('aria-label')?.replace(/\s+/g, ' ').trim();
	if (!value || value.length > MAX_LABEL || isRedactable(value)) return undefined;
	return value;
}

/**
 * The classes worth naming.
 *
 * Capped because X hands every element a dozen generated utility classes, and a wall of
 * `css-1dbjc4n` says nothing a selector can use while filling the whole budget.
 */
function classesOf(el: Element): string[] {
	return Array.from(el.classList).filter(Boolean).slice(0, MAX_CLASSES);
}

function describe(el: Element): string {
	const parts = [el.tagName.toLowerCase()];

	for (const name of KEPT_ATTRIBUTES) {
		const value = el.getAttribute(name);
		if (value === null) continue;
		// A boolean attribute is present or it is not; its value says nothing.
		parts.push(value === '' ? name : `${name}="${value.slice(0, MAX_LABEL)}"`);
	}

	const aria = ariaLabelOf(el);
	if (aria) parts.push(`aria-label="${aria}"`);

	const classes = classesOf(el);
	if (classes.length > 0) parts.push(`class="${classes.join(' ')}"`);

	const label = labelOf(el);
	return label ? `<${parts.join(' ')}> ${label}` : `<${parts.join(' ')}>`;
}

/**
 * Walks what is on screen and writes it out as an indented outline.
 *
 * Only what is visible: a platform keeps whole rendered trees off-screen for the next route,
 * and none of it is what the user is looking at or what the engine will act on.
 */
export function pageStructure(root: Element = document.body): string {
	const lines: string[] = [];
	let truncated = false;
	let size = 0;

	const walk = (el: Element, depth: number): void => {
		if (truncated || depth > MAX_DEPTH || SKIPPED_TAGS.has(el.tagName)) return;

		const line = `${'  '.repeat(depth)}${describe(el)}`;
		if (size + line.length > MAX_CHARS) {
			truncated = true;
			return;
		}
		lines.push(line);
		size += line.length + 1;

		for (const child of Array.from(el.children)) walk(child, depth + 1);
	};

	walk(root, 0);
	if (truncated) {
		lines.push(`(cut at ${MAX_CHARS} characters — the rest of the page is not here)`);
	}
	return lines.join('\n');
}
