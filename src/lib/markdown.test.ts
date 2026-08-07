import { describe, expect, it } from 'vitest';
import { renderNotes } from './markdown';

describe('renderNotes', () => {
	it('turns the shape the release notes actually use into HTML', () => {
		const html = renderNotes(
			[
				'### What&apos;s Changed',
				'',
				'**Updating**',
				'',
				'* New: A thing.',
				'* Fix: Another.'
			].join('\n')
		);

		expect(html).toContain('<h4>What&amp;apos;s Changed</h4>');
		expect(html).toContain('<p><strong>Updating</strong></p>');
		expect(html).toContain('<ul><li>New: A thing.</li><li>Fix: Another.</li></ul>');
	});

	it('folds a wrapped bullet back into one item', () => {
		const html = renderNotes('* A bullet that runs\n  onto a second line.');

		expect(html).toBe('<ul><li>A bullet that runs onto a second line.</li></ul>');
	});

	it('renders a link as its text, because the webview has no way back', () => {
		expect(renderNotes('See [the notes](https://example.com/x).')).toBe('<p>See the notes.</p>');
	});

	/** The notes come off the network; nothing in them may become markup. */
	it('escapes everything before it adds any tag of its own', () => {
		const html = renderNotes('<img src=x onerror="alert(1)"> and **bold**');

		expect(html).not.toContain('<img');
		expect(html).toContain('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
		expect(html).toContain('<strong>bold</strong>');
	});

	it('does not let a fenced-looking line close an element', () => {
		expect(renderNotes('`</p><script>` stays text')).toBe(
			'<p><code>&lt;/p&gt;&lt;script&gt;</code> stays text</p>'
		);
	});
});
