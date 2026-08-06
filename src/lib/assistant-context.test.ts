import { describe, expect, it } from 'vitest';
import { buildPrompt, promptSections, toIssueUrl } from './assistant-context';
import type { LogEntry } from '$lib/bridge/contract';

function entry(message: string, level: LogEntry['level'] = 'info'): LogEntry {
	return { timestamp: '2026-08-03T12:00:00+02:00', level, message };
}

describe('buildPrompt', () => {
	it('describes the app even when nothing has run yet', () => {
		const prompt = buildPrompt('what is this?', [], 'German');

		expect(prompt).toContain('CleanMyPosts');
		expect(prompt).toContain('The log is empty');
		expect(prompt).toContain('what is this?');
		expect(prompt).toContain('German');
	});

	it('carries the log lines through verbatim', () => {
		const prompt = buildPrompt('why?', [entry('deletePosts failed', 'error')], 'English');

		expect(prompt).toContain('error: deletePosts failed');
	});

	/** The prompt is what leaves the machine, so its size cannot grow with the session. */
	it('sends only the tail of a long log and says how much it left out', () => {
		const entries = Array.from({ length: 260 }, (_, index) => entry(`line ${index}`));

		const prompt = buildPrompt('why?', entries, 'English');

		expect(prompt).toContain('60 older ones omitted');
		expect(prompt).not.toContain('line 59');
		expect(prompt).toContain('line 259');
	});

	it('lists what each platform can delete, from the same table the buttons use', () => {
		const prompt = buildPrompt('what can you delete?', [], 'English');

		expect(prompt).toContain('following');
		expect(prompt).toContain('comments');
	});

	it('carries the known failures and their fixes', () => {
		const prompt = buildPrompt('why did it stop?', [], 'English');

		expect(prompt).toContain('throttling the session');
		expect(prompt).toContain('1500 ms');
	});

	/** The preview must be the request, not a summary of it. */
	it('is built from the same sections the preview renders', () => {
		const prompt = buildPrompt('why?', [], 'English');

		for (const section of promptSections('English')) {
			expect(prompt).toContain(section.body);
		}
	});
});

describe('report mode', () => {
	it('asks for a title line, an English body and no identifying detail', () => {
		const prompt = buildPrompt('it stopped', [], 'German', 'report', '2.1.4');

		expect(prompt).toContain('The first line is the title');
		expect(prompt).toContain('CleanMyPosts 2.1.4');
		expect(prompt).toContain('public issue on GitHub');
		expect(prompt).toContain('the signed-in account');
	});

	it('is absent unless the mode asks for it', () => {
		expect(buildPrompt('why?', [], 'English')).not.toContain('Write a bug report');
	});
});

describe('toIssueUrl', () => {
	const repo = 'https://github.com/thorstenalpers/CleanMyPosts';

	it('splits the first line off as the title', () => {
		const answer = ['Likes stop after ten items', '', 'Steps:', '- run it'].join('\n');
		const url = new URL(toIssueUrl(repo, answer));

		expect(url.pathname).toBe('/thorstenalpers/CleanMyPosts/issues/new');
		expect(url.searchParams.get('title')).toBe('Likes stop after ten items');
		expect(url.searchParams.get('body')).toBe('Steps:\n- run it');
	});

	it('drops a heading marker the model put on the title', () => {
		const url = new URL(toIssueUrl(repo, '# A title\nbody'));

		expect(url.searchParams.get('title')).toBe('A title');
	});

	// A url that runs past what GitHub accepts is a report nobody receives: it answers 414.
	it('cuts the body to a url that survives the trip, and says so', () => {
		const url = toIssueUrl(repo, 'title\n' + 'x'.repeat(20000));

		expect(url.length).toBeLessThanOrEqual(7000);
		expect(new URL(url).searchParams.get('body')).toMatch(/cut to fit/);
	});

	// The whole point of the button: an issue with a headline and nothing under it is the one
	// shape a maintainer cannot act on — and one that says the same thing twice is no better.
	it('folds a one-line answer into a report form instead of repeating it', () => {
		const url = new URL(toIssueUrl(repo, 'Likes are not deleted', '1.2.0'));
		const title = url.searchParams.get('title');
		const body = url.searchParams.get('body') ?? '';

		expect(title).toBe('Likes are not deleted');
		expect(body).not.toBe(title);
		expect(body).toContain('## What happened\n\nLikes are not deleted');
		expect(body).toContain('## Steps to reproduce');
		expect(body).toContain('CleanMyPosts 1.2.0');
	});

	it('falls back to an empty form when there is no answer at all', () => {
		const url = new URL(toIssueUrl(repo, '   '));

		expect(url.searchParams.get('title')).toBe('Bug report');
		expect(url.searchParams.get('body')).toContain('Describe what you did');
		expect(url.searchParams.get('body')).toContain('version unknown');
	});

	it('finds the title under a fence or a leading blank line', () => {
		const fenced = new URL(toIssueUrl(repo, '```\nA title\nthe body\n```'));
		expect(fenced.searchParams.get('title')).toBe('A title');
		expect(fenced.searchParams.get('body')).toContain('the body');

		const padded = new URL(toIssueUrl(repo, '\n\n**Title:** A title\nthe body'));
		expect(padded.searchParams.get('title')).toBe('A title');
		expect(padded.searchParams.get('body')).toBe('the body');
	});
});
