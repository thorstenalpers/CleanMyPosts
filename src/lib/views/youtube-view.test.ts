import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/svelte';
import YouTubeView from './youtube-view.svelte';
import { SettingsStore } from '$lib/stores/settings.svelte';
import { SiteLoginStore } from '$lib/stores/site-login.svelte';
import { ActionRunner } from '$lib/stores/action-runner.svelte';
import { createMockHost } from '$lib/bridge/mock';

function setup(confirmDeletion: boolean) {
	const navigate = vi.fn(() => ({ ok: true }));
	const runAction = vi.fn(() => ({ deletedCount: 7 }));
	const hide = vi.fn();

	const { client, emit } = createMockHost({
		'settings.get': () => ({
			theme: 'Default',
			language: 'System',
			showIntro: true,
			showLogs: false,
			showX: true,
			showYouTube: true,
			confirmDeletion,
			notifications: true,
			debugLogging: false,
			autoConsent: true,
			persistSession: true,
			themePreset: 'default' as const,
			showAssistant: true,
			assistantSource: 'claude-code',
			assistantCliPath: '',
			engineScript: '',
			timeouts: { waitAfterDelete: 1, waitBetweenRetryDeleteAttempts: 1, waitAfterDocumentLoad: 1 }
		}),
		'site.navigate': navigate,
		'site.runAction': runAction,
		'site.hide': (params) => {
			hide(params);
			return undefined;
		}
	});

	const settingsStore = new SettingsStore(client);
	const loginStore = new SiteLoginStore(client);
	const runner = new ActionRunner(client);
	return { client, emit, settingsStore, loginStore, runner, navigate, runAction, hide };
}

describe('YouTubeView', () => {
	it('navigates to comments when Show is clicked', async () => {
		const { client, emit, settingsStore, loginStore, runner, navigate } = setup(true);
		await settingsStore.load();
		emit({ event: 'siteLogin', payload: { platform: 'youtube', loggedIn: true } });
		render(YouTubeView, {
			bridge: client,
			settingsStore,
			loginStore,
			runner,
			open: true,
			onClose: () => {}
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Show Comments' }));

		await waitFor(() =>
			expect(navigate).toHaveBeenCalledWith({ platform: 'youtube', action: 'showComments' })
		);
	});

	it('runs deleteLikes after confirming', async () => {
		const { client, emit, settingsStore, loginStore, runner, runAction } = setup(true);
		await settingsStore.load();
		emit({ event: 'siteLogin', payload: { platform: 'youtube', loggedIn: true } });
		render(YouTubeView, {
			bridge: client,
			settingsStore,
			loginStore,
			runner,
			open: true,
			onClose: () => {}
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Delete all Likes' }));

		const dialog = await screen.findByRole('alertdialog');
		await fireEvent.click(within(dialog).getByRole('button', { name: /^delete$/i }));

		await waitFor(() =>
			expect(runAction).toHaveBeenCalledWith(
				expect.objectContaining({ platform: 'youtube', action: 'deleteLikes' })
			)
		);
	});
});
