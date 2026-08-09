import { describe, expect, it, beforeEach } from 'vitest';
import { pageStructure } from './structure';

describe('the page structure that is sent', () => {
	beforeEach(() => {
		document.body.innerHTML = '';
	});

	function structure(markup: string): string {
		document.body.innerHTML = markup;
		return pageStructure();
	}

	it('carries what a selector is built from', () => {
		const out = structure(
			'<div data-testid="cellInnerDiv" class="css-1dbjc4n"><button role="button" aria-label="Unlike"></button></div>'
		);

		expect(out).toContain('data-testid="cellInnerDiv"');
		expect(out).toContain('role="button"');
		expect(out).toContain('aria-label="Unlike"');
		expect(out).toContain('css-1dbjc4n');
	});

	/**
	 * The whole reason the page may be sent at all: the engine matches menu entries by their
	 * wording, and a user whose platform is in Turkish needs the model to see that wording.
	 */
	it('carries the words on a control, because that is what the engine matches', () => {
		const out = structure('<div role="menuitem">Beğenilenlerden kaldır</div>');

		expect(out).toContain('Beğenilenlerden kaldır');
	});

	it('leaves the words in a post behind', () => {
		const out = structure(
			'<article data-testid="tweet"><div lang="en">the actual thing the user posted</div></article>'
		);

		expect(out).toContain('data-testid="tweet"');
		expect(out).not.toContain('the actual thing the user posted');
	});

	// A label is chrome; a label that names a person is not. X words its reply button after the
	// account being replied to, which is how a handle would otherwise ride out on a button.
	it('drops a label whole once it names somebody', () => {
		const out = structure(
			'<button aria-label="Reply to @someone">Reply to @someone</button><button aria-label="Reply">Reply</button>'
		);

		expect(out).not.toContain('@someone');
		expect(out).toContain('aria-label="Reply"');
	});

	it('drops an address, an email, and anything long enough to be an id', () => {
		const out = structure(
			[
				'<a aria-label="https://x.com/someone/status/1889">go</a>',
				'<button aria-label="someone@example.com">mail</button>',
				'<button aria-label="1899234723409817">id</button>',
				'<button aria-label="a91f3c0de8b7145926ff">token</button>'
			].join('')
		);

		expect(out).not.toContain('x.com/someone');
		expect(out).not.toContain('example.com');
		expect(out).not.toContain('1899234723409817');
		expect(out).not.toContain('a91f3c0de8b7145926ff');
	});

	it('never carries an href or a src', () => {
		const out = structure(
			'<a href="https://x.com/someone/status/1889" data-testid="link">open</a>' +
				'<img src="https://pbs.twimg.com/media/secret.jpg" />'
		);

		expect(out).not.toContain('pbs.twimg.com');
		expect(out).not.toContain('/status/1889');
		expect(out).toContain('data-testid="link"');
	});

	// X hands every element a dozen generated classes. A wall of css-1dbjc4n says nothing a
	// selector can use and would fill the whole budget saying it.
	it('keeps the class list short enough to read', () => {
		const out = structure('<div class="a b c d e f g h"></div>');

		expect(out).toContain('class="a b c d"');
		expect(out).not.toContain(' e f g h');
	});

	it('says so when it had to stop rather than trailing off', () => {
		const rows = Array.from(
			{ length: 4000 },
			(_, index) => `<div data-testid="row-${index}"></div>`
		).join('');

		const out = structure(rows);

		expect(out).toContain('cut at');
		expect(out.length).toBeLessThan(26000);
	});

	it('leaves script and style content out entirely', () => {
		const out = structure('<script>window.token = "abc";</script><style>.x{color:red}</style>');

		expect(out).not.toContain('window.token');
		expect(out).not.toContain('color:red');
	});
});
