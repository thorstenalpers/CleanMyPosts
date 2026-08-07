import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import SettingsView from './settings-view.svelte';
import { SettingsStore } from '$lib/stores/settings.svelte';
import { createMockHost, type MockHandlers } from '$lib/bridge/mock';

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
