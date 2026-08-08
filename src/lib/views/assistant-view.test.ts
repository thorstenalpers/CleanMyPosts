import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import AssistantView from './assistant-view.svelte';
import { LogStore } from '$lib/stores/log.svelte';
import { SettingsStore } from '$lib/stores/settings.svelte';
import { SiteLoginStore } from '$lib/stores/site-login.svelte';
import { ActionRunner } from '$lib/stores/action-runner.svelte';
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

	return {
		client,
		logStore: new LogStore(client),
		settingsStore: new SettingsStore(client),
		loginStore: new SiteLoginStore(client),
		runner: new ActionRunner(client)
	};
}

describe('AssistantView', () => {
	it('opens the troubleshooting guide in the host browser', async () => {
		const openUrl = vi.fn();
		const { client, logStore, settingsStore, loginStore, runner } = setup({
			'system.openUrl': (params) => {
				openUrl(params);
				return undefined;
			}
		});
		render(AssistantView, {
			bridge: client,
			logStore,
			settingsStore,
			loginStore,
			runner,
			onOpenSettings: () => {}
		});

		const button = await screen.findByRole('button', { name: /troubleshooting/i });
		await fireEvent.click(button);

		await waitFor(() =>
			expect(openUrl).toHaveBeenCalledWith({ url: 'https://example.com/troubleshooting' })
		);
	});

	it('shows the request only once it is asked for, question included', async () => {
		const { client, logStore, settingsStore, loginStore, runner } = setup();
		render(AssistantView, {
			bridge: client,
			logStore,
			settingsStore,
			loginStore,
			runner,
			onOpenSettings: () => {}
		});

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
		const { client, logStore, settingsStore, loginStore, runner } = setup({
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
		render(AssistantView, {
			bridge: client,
			logStore,
			settingsStore,
			loginStore,
			runner,
			onOpenSettings: () => {}
		});

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
		const { client, logStore, settingsStore, loginStore, runner } = setup({ 'assistant.ask': ask });
		render(AssistantView, {
			bridge: client,
			logStore,
			settingsStore,
			loginStore,
			runner,
			onOpenSettings: () => {}
		});

		await fireEvent.input(screen.getByRole('textbox'), { target: { value: 'why?' } });
		await fireEvent.click(screen.getByRole('button', { name: /^ask$/i }));

		await waitFor(() => expect(ask).toHaveBeenCalled());
		expect(asked[0]?.prompt).toContain('support assistant built into CleanMyPosts');
		expect(asked[0]?.prompt).toContain('why?');
	});

	/**
	 * The chain this whole shape exists for: a model answers, the app checks the answer against
	 * the schema, and only a plan that passed gets a button that can touch the page.
	 */
	it('offers the dry run only for an answer that really is a plan', async () => {
		const counted: unknown[] = [];
		const plan = {
			target: { selector: '[data-testid="unlike"]' },
			steps: [{ step: 'click', target: { selector: '[data-testid="unlike"]' } }]
		};
		// Fenced, with a sentence in front of it: the ordinary way a model answers.
		const answer = ['Here you go:', '```json', JSON.stringify(plan), '```'].join('\n');
		const { client, logStore, settingsStore, loginStore, runner } = setup({
			'assistant.ask': () => ({ text: answer }),
			'site.countMatches': (params) => {
				counted.push(params);
				return { count: 47 };
			}
		});
		loginStore.loggedIn.x = true;
		render(AssistantView, {
			bridge: client,
			logStore,
			settingsStore,
			loginStore,
			runner,
			onOpenSettings: () => {}
		});

		await fireEvent.click(screen.getByRole('radio', { name: /ai repair/i }));
		await fireEvent.input(screen.getByRole('textbox'), { target: { value: 'empty my likes' } });
		await fireEvent.click(screen.getByRole('button', { name: /^ask$/i }));

		await fireEvent.click(await screen.findByRole('button', { name: /check first/i }));

		await waitFor(() => expect(counted).toHaveLength(1));
		expect(counted[0]).toEqual({ platform: 'x', target: plan.target });
		expect(await screen.findByText(/47 on this page match it/i)).toBeInTheDocument();
	});

	// An answer that is not a plan looks exactly like one that is. Saying why beats leaving the
	// buttons quietly absent.
	it('says why an answer was refused instead of just offering nothing', async () => {
		const { client, logStore, settingsStore, loginStore, runner } = setup({
			'assistant.ask': () => ({ text: '{ "target": { "index": 5 }, "steps": [] }' })
		});
		loginStore.loggedIn.x = true;
		render(AssistantView, {
			bridge: client,
			logStore,
			settingsStore,
			loginStore,
			runner,
			onOpenSettings: () => {}
		});

		await fireEvent.click(screen.getByRole('radio', { name: /ai repair/i }));
		await fireEvent.input(screen.getByRole('textbox'), { target: { value: 'do a thing' } });
		await fireEvent.click(screen.getByRole('button', { name: /^ask$/i }));

		expect(await screen.findByText(/not a plan/i)).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /check first/i })).not.toBeInTheDocument();
	});

	/**
	 * The regression this stands for, and it took the app down: the repair mode answers with a
	 * plan now, but "save this fix" still wrote whatever came back into the engine script. That
	 * script is evaluated in the platform page before every run, JSON is not JavaScript, and a
	 * parse error is not something the surrounding try/catch can reach — so the run never
	 * started, never reported, and there was nothing to stop.
	 */
	it('does not offer to save a plan as the engine script', async () => {
		const plan = {
			target: { selector: '[data-testid="unlike"]' },
			steps: [{ step: 'click', target: { selector: '[data-testid="unlike"]' } }]
		};
		const { client, logStore, settingsStore, loginStore, runner } = setup({
			'assistant.ask': () => ({ text: JSON.stringify(plan) })
		});
		loginStore.loggedIn.x = true;
		render(AssistantView, {
			bridge: client,
			logStore,
			settingsStore,
			loginStore,
			runner,
			onOpenSettings: () => {}
		});

		await fireEvent.click(screen.getByRole('radio', { name: /ai repair/i }));
		await fireEvent.input(screen.getByRole('textbox'), { target: { value: 'empty my likes' } });
		await fireEvent.click(screen.getByRole('button', { name: /^ask$/i }));

		// The plan's own buttons are there; the one that would have poisoned the engine is not.
		expect(await screen.findByRole('button', { name: /check first/i })).toBeInTheDocument();
		expect(screen.queryByRole('button', { name: /save this fix/i })).not.toBeInTheDocument();
	});
});
