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
			telemetry: true,
			debugLogging: false,
			autoConsent: true,
			persistSession: true,
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
		'updater.checkForUpdates': () => ({ updateAvailable: false, message: 'No updates available.' }),
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

		await fireEvent.click(screen.getByRole('button', { name: /reset/i }));

		await waitFor(() =>
			expect(settingsSet).toHaveBeenCalledWith(expect.objectContaining({ engineScript: '' }))
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
