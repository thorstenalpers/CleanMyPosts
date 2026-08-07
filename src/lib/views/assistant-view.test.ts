import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import AssistantView from './assistant-view.svelte';
import { LogStore } from '$lib/stores/log.svelte';
import { SettingsStore } from '$lib/stores/settings.svelte';
import { createMockHost, defaultMockHandlers, type MockHandlers } from '$lib/bridge/mock';

function setup(overrides: MockHandlers = {}) {
	const { client } = createMockHost({
		'app.getInfo': () => ({
			version: '1.2.3',
			buildDate: '2026-01-01',
			homepageUrl: 'https://example.com/home',
			reportBugUrl: 'https://example.com/bug',
			troubleshootingUrl: 'https://example.com/troubleshooting'
		}),
		'assistant.getSources': () => ({
			local: { found: true, path: 'claude.exe', version: '1.0.0' },
			providers: []
		}),
		'log.getBuffer': () => [],
		'assistant.ask': () => ({ text: 'Because the page was empty.' }),
		'system.openUrl': () => undefined,
		'settings.get': defaultMockHandlers()['settings.get']!,
		'settings.set': () => undefined,
		...overrides
	});

	return { client, logStore: new LogStore(client), settingsStore: new SettingsStore(client) };
}

describe('AssistantView', () => {
	it('opens the troubleshooting guide in the host browser', async () => {
		const openUrl = vi.fn();
		const { client, logStore, settingsStore } = setup({
			'system.openUrl': (params) => {
				openUrl(params);
				return undefined;
			}
		});
		render(AssistantView, { bridge: client, logStore, settingsStore, onOpenSettings: () => {} });

		const button = await screen.findByRole('button', { name: /troubleshooting/i });
		await fireEvent.click(button);

		await waitFor(() =>
			expect(openUrl).toHaveBeenCalledWith({ url: 'https://example.com/troubleshooting' })
		);
	});

	it('shows the request only once it is asked for, question included', async () => {
		const { client, logStore, settingsStore } = setup();
		render(AssistantView, { bridge: client, logStore, settingsStore, onOpenSettings: () => {} });

		expect(screen.queryByText(/known failures and fixes/i)).not.toBeInTheDocument();

		await fireEvent.input(screen.getByRole('textbox'), {
			target: { value: 'why did nothing get deleted?' }
		});
		await fireEvent.click(screen.getByRole('button', { name: /show what is sent/i }));

		expect(screen.getByText(/known failures and fixes/i)).toBeInTheDocument();
		expect(screen.getByText(/throttling the session/)).toBeInTheDocument();
		expect(screen.getByText('why did nothing get deleted?')).toBeInTheDocument();
	});

	it('asks for a patch against the live engine config, and saves the answer as the script', async () => {
		const asked: { prompt: string }[] = [];
		const settingsSet = vi.fn();
		const { client, logStore, settingsStore } = setup({
			'assistant.ask': (params: { prompt: string }) => {
				asked.push(params);
				return { text: "window.__cmp.config.youtube.removeFromLikedText.push('x');" };
			},
			'settings.set': (params) => {
				settingsSet(params);
				return undefined;
			}
		});
		await settingsStore.load();
		render(AssistantView, { bridge: client, logStore, settingsStore, onOpenSettings: () => {} });

		await fireEvent.click(screen.getByRole('radio', { name: /ai repair/i }));
		await fireEvent.input(screen.getByRole('textbox'), { target: { value: 'the menu says X' } });
		await fireEvent.click(screen.getByRole('button', { name: /^ask$/i }));

		await waitFor(() => expect(asked).toHaveLength(1));
		expect(asked[0]?.prompt).toContain('removeFromLikedText');
		expect(asked[0]?.prompt).toContain('AGENTS.md');

		await fireEvent.click(await screen.findByRole('button', { name: /save this fix/i }));

		await waitFor(() =>
			expect(settingsSet).toHaveBeenCalledWith(
				expect.objectContaining({
					engineScript: "window.__cmp.config.youtube.removeFromLikedText.push('x');"
				})
			)
		);
	});

	it('sends the previewed request when asked', async () => {
		const asked: { prompt: string }[] = [];
		const ask = vi.fn((params: { prompt: string }) => {
			asked.push(params);
			return { text: 'ok' };
		});
		const { client, logStore, settingsStore } = setup({ 'assistant.ask': ask });
		render(AssistantView, { bridge: client, logStore, settingsStore, onOpenSettings: () => {} });

		await fireEvent.input(screen.getByRole('textbox'), { target: { value: 'why?' } });
		await fireEvent.click(screen.getByRole('button', { name: /^ask$/i }));

		await waitFor(() => expect(ask).toHaveBeenCalled());
		expect(asked[0]?.prompt).toContain('support assistant built into CleanMyPosts');
		expect(asked[0]?.prompt).toContain('why?');
	});
});
