import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import SettingsView from './settings-view.svelte';
import { SettingsStore } from '$lib/stores/settings.svelte';
import { createMockHost, type MockHandlers } from '$lib/bridge/mock';
import { en } from '$lib/i18n/en';

function setup(overrides: MockHandlers = {}) {
	const settingsSet = vi.fn();
	const { client, emit } = createMockHost({
		'app.getInfo': () => ({
			version: '1.2.3',
			buildDate: '2026-02-03',
			homepageUrl: 'https://example.com/home',
			reportBugUrl: 'https://example.com/bug',
			troubleshootingUrl: 'https://example.com/troubleshooting'
		}),
		'settings.get': () => ({
			theme: 'Default',
			language: 'System',
			showIntro: true,
			showLogs: false,
			showX: true,
			showYouTube: true,
			confirmDeletion: true,
			notifications: true,
			debugLogging: false,
			autoConsent: true,
			persistSession: true,
			checkUpdatesOnStart: true,
			themePreset: 'default' as const,
			showAssistant: true,
			assistantSource: 'claude-code',
			assistantCliPath: '',
			engineScript: '',
			assistantModel: '',
			assistantEffort: 'medium' as const,
			customActions: [],
			timeouts: {
				waitAfterDelete: 500,
				waitBetweenRetryDeleteAttempts: 500,
				waitAfterDocumentLoad: 3000
			}
		}),
		'settings.set': (params) => {
			settingsSet(params);
			return undefined;
		},
		'assistant.getSources': () => ({
			local: { found: false, path: null, version: null },
			providers: [
				{
					id: 'gemini',
					label: 'Google AI',
					model: 'gemini-2.0-flash',
					freeKeyUrl: 'https://aistudio.google.com/api-keys',
					hasKey: false
				}
			]
		}),
		'updater.checkForUpdates': () => ({ updateAvailable: false }),
		'system.openUrl': () => undefined,
		'system.openLicense': () => undefined,
		...overrides
	});

	const settingsStore = new SettingsStore(client);
	return { client, emit, settingsStore, settingsSet };
}

describe('SettingsView', () => {
	// The only place in the app that mentions a missing key. Everywhere else the assistant is
	// simply not there, so if this row goes quiet nothing tells the user why.
	it('says the assistant has no source', async () => {
		const { client, settingsStore } = setup();
		await settingsStore.load();
		render(SettingsView, { bridge: client, settingsStore });

		expect(await screen.findByText(en['settings.assistant.missing'])).toBeInTheDocument();
	});

	it('stops saying it once a provider has a key', async () => {
		const { client, settingsStore } = setup({
			'assistant.getSources': () => ({
				local: { found: false, path: null, version: null },
				providers: [{ id: 'gemini', label: 'Google AI', model: '', freeKeyUrl: '', hasKey: true }]
			})
		});
		await settingsStore.load();
		render(SettingsView, { bridge: client, settingsStore });

		await screen.findByText(en['settings.assistant.description']);
		expect(screen.queryByText(en['settings.assistant.missing'])).not.toBeInTheDocument();
	});

	it('sends an updated theme to the host when a theme button is clicked', async () => {
		const { client, settingsStore, settingsSet } = setup();
		await settingsStore.load();
		render(SettingsView, { bridge: client, settingsStore });

		await fireEvent.click(screen.getByRole('button', { name: /dark/i }));

		await waitFor(() =>
			expect(settingsSet).toHaveBeenCalledWith(expect.objectContaining({ theme: 'Dark' }))
		);
	});

	it('offers the engine script only as edit-or-reset, and resets to the built-in behaviour', async () => {
		const { client, settingsStore, settingsSet } = setup();
		await settingsStore.load();
		settingsStore.settings = { ...settingsStore.settings, engineScript: 'window.x = 1;' };
		render(SettingsView, { bridge: client, settingsStore });

		// Exact: the settings page now also carries a "Reset to defaults" button.
		await fireEvent.click(screen.getByRole('button', { name: 'Reset' }));

		await waitFor(() =>
			expect(settingsSet).toHaveBeenCalledWith(expect.objectContaining({ engineScript: '' }))
		);
	});

	// The one control on this page that throws work away, so it asks first — and the defaults
	// it restores come from the host, not from a second copy of them in the view.
	it('resets every setting through the host, once confirmed', async () => {
		const reset = vi.fn(() => ({
			theme: 'Default' as const,
			language: 'System' as const,
			showIntro: true,
			showLogs: false,
			showX: true,
			showYouTube: true,
			confirmDeletion: true,
			notifications: true,
			debugLogging: false,
			autoConsent: true,
			persistSession: true,
			checkUpdatesOnStart: true,
			themePreset: 'default' as const,
			showAssistant: true,
			assistantSource: 'claude-code',
			assistantCliPath: '',
			engineScript: '',
			assistantModel: '',
			assistantEffort: 'medium' as const,
			customActions: [],
			timeouts: {
				waitAfterDelete: 500,
				waitBetweenRetryDeleteAttempts: 500,
				waitAfterDocumentLoad: 3000
			}
		}));
		const { client, settingsStore } = setup({ 'settings.reset': reset });
		await settingsStore.load();
		render(SettingsView, { bridge: client, settingsStore });

		await fireEvent.click(screen.getByRole('button', { name: 'Reset to defaults' }));
		expect(reset).not.toHaveBeenCalled();

		// The dialog repeats the label on its confirm button, which is the point: the last one
		// on the page is the one inside the dialog.
		const confirms = await screen.findAllByRole('button', { name: 'Reset to defaults' });
		await fireEvent.click(confirms[confirms.length - 1]!);

		await waitFor(() => expect(reset).toHaveBeenCalled());
		// Closing is the receipt: the dialog stays up when the host refuses.
		await waitFor(() =>
			expect(screen.queryAllByRole('button', { name: 'Reset to defaults' })).toHaveLength(1)
		);
	});

	it('keeps the dialog up when the reset fails', async () => {
		const { client, settingsStore } = setup({
			'settings.reset': () => {
				throw new Error('unknown bridge method');
			}
		});
		await settingsStore.load();
		render(SettingsView, { bridge: client, settingsStore });

		await fireEvent.click(screen.getByRole('button', { name: 'Reset to defaults' }));
		const confirms = await screen.findAllByRole('button', { name: 'Reset to defaults' });
		await fireEvent.click(confirms[confirms.length - 1]!);

		await waitFor(() =>
			expect(screen.queryAllByRole('button', { name: 'Reset to defaults' })).toHaveLength(2)
		);
	});

	// Seven presets in a row wrapped across the whole width of the card; they are a list, and a
	// list of names belongs behind one trigger, the way the language beside it already is.
	it('picks a colour from a dropdown that says which one is on', async () => {
		const { client, settingsStore, settingsSet } = setup();
		await settingsStore.load();
		render(SettingsView, { bridge: client, settingsStore });

		const trigger = screen.getByRole('button', { name: 'Colour' });
		expect(trigger).toHaveTextContent('Default');

		await fireEvent.click(trigger);
		await fireEvent.click(await screen.findByRole('menuitem', { name: 'Vercel' }));

		await waitFor(() =>
			expect(settingsSet).toHaveBeenCalledWith(expect.objectContaining({ themePreset: 'vercel' }))
		);
	});

	it('toggles confirmDeletion via the switch', async () => {
		const { client, settingsStore, settingsSet } = setup();
		await settingsStore.load();
		render(SettingsView, { bridge: client, settingsStore });

		const toggle = screen.getByRole('switch', { name: /confirm before deleting/i });
		await fireEvent.click(toggle);

		await waitFor(() =>
			expect(settingsSet).toHaveBeenCalledWith(expect.objectContaining({ confirmDeletion: false }))
		);
	});
});

/**
 * A saved plan is a selector against a page that has since moved, so these go stale on their
 * own and the list is where somebody comes to clear them out.
 */
describe('saved actions in the settings', () => {
	const action = {
		id: 'a1',
		label: 'Bookmarks',
		platform: 'x' as const,
		place: 'panel' as const,
		plan: {
			kind: 'loop' as const,
			target: { selector: '[data-testid="bookmark"]' },
			steps: [{ step: 'click' as const, target: { selector: '[data-testid="bookmark"]' } }]
		},
		createdAt: '2026-08-08T10:00:00+02:00'
	};

	it('says so plainly when nothing has been kept', async () => {
		const { client, settingsStore } = setup();
		await settingsStore.load();
		render(SettingsView, { bridge: client, settingsStore });

		expect(screen.getByText(/nothing kept yet/i)).toBeInTheDocument();
	});

	it('lists what was kept, and forgets one on its own button', async () => {
		const { client, settingsStore, settingsSet } = setup();
		await settingsStore.load();
		settingsStore.settings = { ...settingsStore.settings, customActions: [action] };
		render(SettingsView, { bridge: client, settingsStore });

		expect(screen.getByText('Bookmarks')).toBeInTheDocument();

		await fireEvent.click(screen.getByRole('button', { name: /^forget$/i }));

		await waitFor(() =>
			expect(settingsSet).toHaveBeenCalledWith(expect.objectContaining({ customActions: [] }))
		);
	});

	// Forgetting one is not worth a dialog; forgetting the lot is, because there is no getting
	// a plan back once the answer it came from is gone.
	it('asks before it forgets all of them', async () => {
		const { client, settingsStore, settingsSet } = setup();
		await settingsStore.load();
		settingsStore.settings = { ...settingsStore.settings, customActions: [action] };
		render(SettingsView, { bridge: client, settingsStore });

		await fireEvent.click(screen.getByRole('button', { name: /forget all/i }));
		expect(settingsSet).not.toHaveBeenCalled();

		const confirms = await screen.findAllByRole('button', { name: /forget all/i });
		await fireEvent.click(confirms[confirms.length - 1]!);

		await waitFor(() =>
			expect(settingsSet).toHaveBeenCalledWith(expect.objectContaining({ customActions: [] }))
		);
	});

	// The order is the user's now, and it is the order every other surface reads from: the
	// sidebar, the platform panel and the overview all render this same list.
	it('moves a row, and the ends do not move', async () => {
		const second = { ...action, id: 'a2', label: 'Drafts' };
		const { client, settingsStore, settingsSet } = setup();
		await settingsStore.load();
		settingsStore.settings = { ...settingsStore.settings, customActions: [action, second] };
		render(SettingsView, { bridge: client, settingsStore });

		const [downFirst] = screen.getAllByRole('button', { name: /move down/i });
		await fireEvent.click(downFirst!);

		await waitFor(() =>
			expect(settingsSet).toHaveBeenCalledWith(
				expect.objectContaining({
					customActions: [
						expect.objectContaining({ id: 'a2' }),
						expect.objectContaining({ id: 'a1' })
					]
				})
			)
		);
	});

	it('renames one in place', async () => {
		const { client, settingsStore, settingsSet } = setup();
		await settingsStore.load();
		settingsStore.settings = { ...settingsStore.settings, customActions: [action] };
		render(SettingsView, { bridge: client, settingsStore });

		await fireEvent.click(screen.getByRole('button', { name: /rename/i }));
		const field = screen.getByRole('textbox', { name: /rename/i });
		await fireEvent.input(field, { target: { value: 'Old bookmarks' } });
		await fireEvent.blur(field);

		await waitFor(() =>
			expect(settingsSet).toHaveBeenCalledWith(
				expect.objectContaining({
					customActions: [expect.objectContaining({ label: 'Old bookmarks' })]
				})
			)
		);
	});

	/** Readable before it is trusted: that a person can check it is the whole case for a plan. */
	it('shows the plan itself on request', async () => {
		const { client, settingsStore } = setup();
		await settingsStore.load();
		settingsStore.settings = { ...settingsStore.settings, customActions: [action] };
		render(SettingsView, { bridge: client, settingsStore });

		expect(screen.queryByText(/scrollUntil|"kind"/)).not.toBeInTheDocument();

		await fireEvent.click(screen.getByRole('button', { name: /^plan$/i }));

		// The steps themselves, as they are stored — not a summary of them.
		const shown = screen.getByText(/"kind"/);
		expect(shown).toHaveTextContent('loop');
		expect(shown).toHaveTextContent('bookmark');
	});
});
