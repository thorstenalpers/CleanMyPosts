import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import InfoView from './info-view.svelte';
import { createMockHost, defaultMockHandlers, type MockHandlers } from '$lib/bridge/mock';
import { SettingsStore } from '$lib/stores/settings.svelte';

function setup(overrides: MockHandlers = {}) {
	const { client } = createMockHost({
		'app.getInfo': () => ({
			version: '1.2.3',
			homepageUrl: 'https://example.com/home',
			reportBugUrl: 'https://example.com/bug',
			troubleshootingUrl: 'https://example.com/troubleshooting'
		}),
		'updater.checkForUpdates': () => ({ updateAvailable: false, message: 'No updates available.' }),
		'system.openUrl': () => undefined,
		'system.openLicense': () => undefined,
		'settings.get': defaultMockHandlers()['settings.get']!,
		...overrides
	});

	return { client, settingsStore: new SettingsStore(client) };
}

describe('InfoView', () => {
	it('shows the app version once app.getInfo resolves', async () => {
		const { client, settingsStore } = setup();
		render(InfoView, { bridge: client, settingsStore });

		await waitFor(() => expect(screen.getByText(/1\.2\.3/)).toBeInTheDocument());
	});

	it('calls updater.checkForUpdates when the button is clicked', async () => {
		const checkForUpdates = vi.fn(() => ({
			updateAvailable: false,
			message: 'No updates available.'
		}));
		const { client, settingsStore } = setup({ 'updater.checkForUpdates': checkForUpdates });
		render(InfoView, { bridge: client, settingsStore });

		await fireEvent.click(screen.getByRole('button', { name: /check for updates/i }));

		await waitFor(() => expect(checkForUpdates).toHaveBeenCalled());
	});

	it('opens the project page in the host, not in the webview', async () => {
		const openUrl = vi.fn();
		const { client, settingsStore } = setup({
			'system.openUrl': (params) => {
				openUrl(params);
				return undefined;
			}
		});
		render(InfoView, { bridge: client, settingsStore });

		const github = await screen.findByRole('button', { name: 'GitHub' });
		await fireEvent.click(github);

		await waitFor(() => expect(openUrl).toHaveBeenCalledWith({ url: 'https://example.com/home' }));
	});
});
