import { describe, expect, it } from 'vitest';
import { buildPrompt } from './assistant-context';
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
});
