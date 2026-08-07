import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import InfoView from './info-view.svelte';
import { createMockHost, defaultMockHandlers, type MockHandlers } from '$lib/bridge/mock';
import { SettingsStore } from '$lib/stores/settings.svelte';

function setup(overrides: MockHandlers = {}) {
	const { client, emit } = createMockHost({
		'app.getInfo': () => ({
			version: '1.2.3',
			homepageUrl: 'https://example.com/home',
			reportBugUrl: 'https://example.com/bug',
			troubleshootingUrl: 'https://example.com/troubleshooting'
		}),
		'updater.checkForUpdates': () => ({ updateAvailable: false }),
		'system.openUrl': () => undefined,
		'system.openLicense': () => undefined,
		'settings.get': defaultMockHandlers()['settings.get']!,
		...overrides
	});

	return { client, emit, settingsStore: new SettingsStore(client) };
}

describe('InfoView', () => {
	it('shows the app version once app.getInfo resolves', async () => {
		const { client, settingsStore } = setup();
		render(InfoView, { bridge: client, settingsStore });

		await waitFor(() => expect(screen.getByText(/1\.2\.3/)).toBeInTheDocument());
	});

	it('calls updater.checkForUpdates when the button is clicked', async () => {
		const checkForUpdates = vi.fn(() => ({ updateAvailable: false }));
		const { client, settingsStore } = setup({ 'updater.checkForUpdates': checkForUpdates });
		render(InfoView, { bridge: client, settingsStore });

		await fireEvent.click(screen.getByRole('button', { name: /check for updates/i }));

		await waitFor(() => expect(checkForUpdates).toHaveBeenCalled());
	});

	it('installs nothing until the offered version has been confirmed', async () => {
		const installUpdate = vi.fn(() => undefined);
		const { client, settingsStore } = setup({
			'updater.checkForUpdates': () => ({ updateAvailable: true, version: '9.9.9' }),
			'updater.installUpdate': installUpdate
		});
		render(InfoView, { bridge: client, settingsStore });

		await fireEvent.click(screen.getByRole('button', { name: /check for updates/i }));

		await screen.findByText(/9\.9\.9/);
		expect(installUpdate).not.toHaveBeenCalled();

		await fireEvent.click(screen.getByRole('button', { name: /install and restart/i }));

		await waitFor(() => expect(installUpdate).toHaveBeenCalled());
	});

	it('follows the download with the progress the host pushes', async () => {
		const { client, emit, settingsStore } = setup({
			'updater.checkForUpdates': () => ({ updateAvailable: true, version: '9.9.9' }),
			'updater.installUpdate': () => undefined
		});
		render(InfoView, { bridge: client, settingsStore });

		await fireEvent.click(screen.getByRole('button', { name: /check for updates/i }));
		await fireEvent.click(await screen.findByRole('button', { name: /install and restart/i }));

		const bar = await screen.findByRole('progressbar');
		expect(bar).toHaveAttribute('aria-label', 'Downloading update 9.9.9');

		emit({ event: 'updateProgress', payload: { downloaded: 420, contentLength: 1000 } });

		await waitFor(() => expect(screen.getByText('42%')).toBeInTheDocument());
		expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '42');
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
