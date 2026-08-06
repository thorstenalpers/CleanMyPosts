import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { dismissConsentBanner, startConsentWatcher } from './consent';

/** happy-dom lays nothing out, so visibility has to be granted explicitly. */
function makeVisible(): void {
	for (const el of document.querySelectorAll('button')) {
		el.getClientRects = () => [{} as DOMRect] as unknown as DOMRectList;
	}
}

function banner(html: string): void {
	document.body.innerHTML = `<div id="banner">${html}</div>`;
	makeVisible();
}

describe('dismissConsentBanner', () => {
	beforeEach(() => {
		window.chrome = {
			webview: { postMessage: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn() }
		};
	});

	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('prefers the declining button over the accepting one', () => {
		banner(`
			<p>We use cookies to personalise content.</p>
			<button id="accept">Accept all cookies</button>
			<button id="refuse">Refuse non-essential cookies</button>
		`);
		const clicked = vi.fn();
		document.getElementById('refuse')!.addEventListener('click', clicked);

		expect(dismissConsentBanner()).toBe(true);
		expect(clicked).toHaveBeenCalled();
	});

	it.each([
		['de', 'Wir verwenden Cookies.', 'Alle akzeptieren'],
		['fr', 'Ce site utilise des cookies.', 'Tout accepter'],
		['ja', 'このサイトはクッキーを使用します。', '同意する'],
		['ar', 'نستخدم ملفات تعريف الارتباط.', 'موافق'],
		['ru', 'Мы используем куки.', 'Принять'],
		['zh', '本网站使用 Cookie。', '接受']
	])('clicks the accepting button when %s is the only option', (_lang, text, buttonText) => {
		banner(`<p>${text}</p><button id="only">${buttonText}</button>`);
		const clicked = vi.fn();
		document.getElementById('only')!.addEventListener('click', clicked);

		expect(dismissConsentBanner()).toBe(true);
		expect(clicked).toHaveBeenCalled();
	});

	it('leaves buttons outside a cookie banner alone', () => {
		banner('<p>Delete this post?</p><button id="ok">OK</button>');
		const clicked = vi.fn();
		document.getElementById('ok')!.addEventListener('click', clicked);

		expect(dismissConsentBanner()).toBe(false);
		expect(clicked).not.toHaveBeenCalled();
	});

	it('ignores a disabled button', () => {
		banner('<p>We use cookies.</p><button id="accept" disabled>Accept</button>');

		expect(dismissConsentBanner()).toBe(false);
	});
});

describe('startConsentWatcher', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		window.chrome = {
			webview: { postMessage: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn() }
		};
	});

	afterEach(() => {
		vi.useRealTimers();
		document.body.innerHTML = '';
	});

	// Captured from a real youtube.com visit. The dialog carries a full language picker on top
	// of the consent text, which puts its length far past what a "banner" was allowed to be —
	// the two buttons were found every time and the container around them never counted.
	it('dismisses the YouTube consent lightbox, language picker and all', () => {
		const languages = [
			'Afrikaans',
			'Azərbaycan',
			'Bahasa Indonesia',
			'Bosanski',
			'Català',
			'Čeština',
			'Dansk',
			'Deutsch',
			'English (UK)',
			'Español (España)',
			'Français (Canada)',
			'Hrvatski',
			'Íslenska',
			'Kiswahili',
			'Latviešu valoda',
			'Nederlands',
			'Português (Brasil)',
			'Slovenčina',
			'Tiếng Việt',
			'Türkçe'
		].join(' ');

		banner(
			`<div>Saving your choice ${languages.repeat(6)}
			 We use <a>cookies and data</a>, including IP addresses, to deliver and maintain
			 Google services, and to measure audience engagement.</div>
			 <button id="reject" aria-label="Reject the use of cookies and other data for the purposes described">Reject all</button>
			 <button id="accept" aria-label="Accept the use of cookies and other data for the purposes described">Accept all</button>
			 <a id="more">More options</a>`
		);
		expect(document.body.textContent.length).toBeGreaterThan(1500);

		const rejected = vi.fn();
		const accepted = vi.fn();
		document.getElementById('reject')!.addEventListener('click', rejected);
		document.getElementById('accept')!.addEventListener('click', accepted);

		expect(dismissConsentBanner()).toBe(true);
		expect(rejected).toHaveBeenCalled();
		expect(accepted).not.toHaveBeenCalled();
	});

	it('dismisses a banner that only appears after the page has loaded', async () => {
		startConsentWatcher();
		await vi.advanceTimersByTimeAsync(2000);

		banner('<p>We use cookies.</p><button id="accept">Accept all</button>');
		const clicked = vi.fn();
		document.getElementById('accept')!.addEventListener('click', clicked);

		await vi.advanceTimersByTimeAsync(600);
		expect(clicked).toHaveBeenCalled();
	});

	it('stops polling once the wait window has passed', async () => {
		const spy = vi.spyOn(document, 'querySelectorAll');
		startConsentWatcher();

		await vi.advanceTimersByTimeAsync(21000);
		const callsAfterTimeout = spy.mock.calls.length;
		await vi.advanceTimersByTimeAsync(5000);

		expect(spy.mock.calls.length).toBe(callsAfterTimeout);
		spy.mockRestore();
	});
});
