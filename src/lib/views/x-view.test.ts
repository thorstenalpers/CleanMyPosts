import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/svelte';
import XView from './x-view.svelte';
import { SettingsStore } from '$lib/stores/settings.svelte';
import { SiteLoginStore } from '$lib/stores/site-login.svelte';
import { ActionRunner } from '$lib/stores/action-runner.svelte';
import { createMockHost, type MockHandlers } from '$lib/bridge/mock';

function setup(confirmDeletion: boolean, overrides: MockHandlers = {}) {
	const navigate = vi.fn(() => ({ ok: true }));
	const runAction = vi.fn(() => ({ deletedCount: 3 }));
	const hide = vi.fn();

	const { client, emit } = createMockHost({
		'settings.get': () => ({
			theme: 'Default',
			showLogs: false,
			confirmDeletion,
			accentColor: '#3B82F6',
			useSystemAccent: false,
			timeouts: { waitAfterDelete: 1, waitBetweenRetryDeleteAttempts: 1, waitAfterDocumentLoad: 1 }
		}),
		'site.navigate': navigate,
		'site.runAction': runAction,
		'site.hide': (params) => {
			hide(params);
			return undefined;
		},
		...overrides
	});

	const settingsStore = new SettingsStore(client);
	const loginStore = new SiteLoginStore(client);
	const runner = new ActionRunner(client);

	return { client, emit, settingsStore, loginStore, runner, navigate, runAction, hide };
}

async function loadAndLogin(settingsStore: SettingsStore, emit: ReturnType<typeof setup>['emit']) {
	await settingsStore.load();
	emit({ event: 'siteLogin', payload: { platform: 'x', loggedIn: true } });
}

describe('XView', () => {
	it('navigates when a Show button is clicked', async () => {
		const { client, emit, settingsStore, loginStore, runner, navigate } = setup(true);
		await loadAndLogin(settingsStore, emit);
		render(XView, { bridge: client, settingsStore, loginStore, runner });

		await fireEvent.click(screen.getByRole('button', { name: 'Show Posts' }));

		await waitFor(() =>
			expect(navigate).toHaveBeenCalledWith({ platform: 'x', action: 'showPosts' })
		);
	});

	it('disables all action buttons until the host reports the user is logged in', async () => {
		const { client, emit, settingsStore, loginStore, runner } = setup(true);
		await settingsStore.load();
		render(XView, { bridge: client, settingsStore, loginStore, runner });

		expect(screen.getAllByRole('button', { name: /show/i })[0]).toBeDisabled();

		emit({ event: 'siteLogin', payload: { platform: 'x', loggedIn: true } });
		await waitFor(() =>
			expect(screen.getAllByRole('button', { name: /show/i })[0]).not.toBeDisabled()
		);
	});

	it('opens a confirmation dialog before deleting when confirmDeletion is enabled', async () => {
		const { client, emit, settingsStore, loginStore, runner, runAction } = setup(true);
		await loadAndLogin(settingsStore, emit);
		render(XView, { bridge: client, settingsStore, loginStore, runner });

		await fireEvent.click(screen.getByRole('button', { name: 'Delete all Posts' }));

		expect(await screen.findByText('Delete all posts?')).toBeInTheDocument();
		expect(runAction).not.toHaveBeenCalled();

		const dialog = screen.getByRole('alertdialog');
		await fireEvent.click(within(dialog).getByRole('button', { name: /^delete$/i }));

		await waitFor(() =>
			expect(runAction).toHaveBeenCalledWith(
				expect.objectContaining({ platform: 'x', action: 'deletePosts' })
			)
		);
	});

	it('cancelling the confirmation dialog does not run the delete action', async () => {
		const { client, emit, settingsStore, loginStore, runner, runAction } = setup(true);
		await loadAndLogin(settingsStore, emit);
		render(XView, { bridge: client, settingsStore, loginStore, runner });

		await fireEvent.click(screen.getByRole('button', { name: 'Delete all Posts' }));
		expect(await screen.findByText('Delete all posts?')).toBeInTheDocument();

		await fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

		expect(runAction).not.toHaveBeenCalled();
	});

	it('deletes immediately without a dialog when confirmDeletion is disabled', async () => {
		const { client, emit, settingsStore, loginStore, runner, runAction } = setup(false);
		await loadAndLogin(settingsStore, emit);
		render(XView, { bridge: client, settingsStore, loginStore, runner });

		await fireEvent.click(screen.getByRole('button', { name: 'Delete all Posts' }));

		await waitFor(() =>
			expect(runAction).toHaveBeenCalledWith(
				expect.objectContaining({ platform: 'x', action: 'deletePosts' })
			)
		);
		expect(screen.queryByText('Delete all posts?')).not.toBeInTheDocument();
	});
});
