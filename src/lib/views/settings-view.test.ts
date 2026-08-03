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
			reportBugUrl: 'https://example.com/bug'
		}),
		'settings.get': () => ({
			theme: 'Default',
			language: 'System',
			showIntro: true,
			showLogs: false,
			showX: true,
			showYouTube: true,
			confirmDeletion: true,
			themePreset: 'Default' as const,
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
		'updater.checkForUpdates': () => ({ updateAvailable: false, message: 'No updates available.' }),
		'system.openUrl': () => undefined,
		'system.openLicense': () => undefined,
		...overrides
	});

	const settingsStore = new SettingsStore(client);
	return { client, emit, settingsStore, settingsSet };
}

describe('SettingsView', () => {
	it('shows the app version once app.getInfo resolves', async () => {
		const { settingsStore } = setup();
		await settingsStore.load();
		render(SettingsView, { bridge: setup().client, settingsStore });

		await waitFor(() => expect(screen.getByText(/1\.2\.3|CleanMyPosts/)).toBeInTheDocument());
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

	it('calls updater.checkForUpdates when the button is clicked', async () => {
		const checkForUpdates = vi.fn(() => ({
			updateAvailable: false,
			message: 'No updates available.'
		}));
		const { client, settingsStore } = setup({ 'updater.checkForUpdates': checkForUpdates });
		await settingsStore.load();
		render(SettingsView, { bridge: client, settingsStore });

		await fireEvent.click(screen.getByRole('button', { name: /check for updates/i }));

		await waitFor(() => expect(checkForUpdates).toHaveBeenCalled());
	});
});
