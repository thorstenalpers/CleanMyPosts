/**
 * The little bit of markdown the release notes actually use, turned into HTML.
 *
 * Deliberately not a markdown library. This text arrives over the network and is written
 * into the chrome webview with `{@html}`, so the rule is that nothing in the input can
 * become markup: the whole string is escaped first, and only the patterns below are turned
 * back into tags afterwards. A parser that passes raw HTML through — which every general
 * one does — would hand a release feed a way into the app's own origin.
 *
 * Links render as their text alone. The chrome webview has no address bar and no way back,
 * so an anchor in here would be a one-way trip out of the app.
 */

const ESCAPES: Record<string, string> = {
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;',
	'"': '&quot;',
	"'": '&#39;'
};

function escape(text: string): string {
	return text.replace(/[&<>"']/g, (char) => ESCAPES[char] ?? char);
}

/** Runs on already-escaped text, so none of these can introduce a tag boundary. */
function inline(text: string): string {
	return text
		.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
		.replace(/`([^`]+)`/g, '<code>$1</code>')
		.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

type Block =
	| { kind: 'heading'; text: string }
	| { kind: 'list'; items: string[] }
	| { kind: 'paragraph'; lines: string[] };

function blocks(lines: string[]): Block[] {
	const out: Block[] = [];

	for (const line of lines) {
		const last = out.at(-1);
		const heading = /^#{1,6}\s+(.*)$/.exec(line);
		const bullet = /^[*-]\s+(.*)$/.exec(line);

		if (!line.trim()) {
			if (last) out.push({ kind: 'paragraph', lines: [] });
			continue;
		}
		if (heading) {
			out.push({ kind: 'heading', text: heading[1] ?? '' });
			continue;
		}
		if (bullet) {
			if (last?.kind === 'list') last.items.push(bullet[1] ?? '');
			else out.push({ kind: 'list', items: [bullet[1] ?? ''] });
			continue;
		}
		// An indented line belongs to whatever it is under: the notes wrap long bullets.
		if (/^\s/.test(line) && last?.kind === 'list' && last.items.length) {
			last.items[last.items.length - 1] += ` ${line.trim()}`;
			continue;
		}
		if (last?.kind === 'paragraph') last.lines.push(line.trim());
		else out.push({ kind: 'paragraph', lines: [line.trim()] });
	}

	return out.filter((block) => block.kind !== 'paragraph' || block.lines.length > 0);
}

/** Markdown in, HTML out. Safe to hand to `{@html}`. */
export function renderNotes(markdown: string): string {
	return blocks(escape(markdown.replace(/\r\n?/g, '\n')).split('\n'))
		.map((block) => {
			if (block.kind === 'heading') return `<h4>${inline(block.text)}</h4>`;
			if (block.kind === 'list') {
				return `<ul>${block.items.map((item) => `<li>${inline(item)}</li>`).join('')}</ul>`;
			}
			return `<p>${inline(block.lines.join(' '))}</p>`;
		})
		.join('');
}
