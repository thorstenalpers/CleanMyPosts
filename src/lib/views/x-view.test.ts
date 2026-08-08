import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/svelte';
import XView from './x-view.svelte';
import { SettingsStore } from '$lib/stores/settings.svelte';
import { SiteLoginStore } from '$lib/stores/site-login.svelte';
import { ActionRunner } from '$lib/stores/action-runner.svelte';
import { createMockHost, type MockHandlers } from '$lib/bridge/mock';

const SAVED_ACTION = {
	id: 'saved-1',
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

function setup(
	confirmDeletion: boolean,
	overrides: MockHandlers = {},
	customActions: (typeof SAVED_ACTION)[] = []
) {
	const navigate = vi.fn(() => ({ ok: true }));
	const runAction = vi.fn(() => ({ deletedCount: 3 }));
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
			checkUpdatesOnStart: true,
			themePreset: 'default' as const,
			showAssistant: true,
			assistantSource: 'claude-code',
			assistantCliPath: '',
			engineScript: '',
			assistantModel: '',
			assistantEffort: 'medium' as const,
			customActions,
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
		render(XView, {
			bridge: client,
			settingsStore,
			loginStore,
			runner,
			open: true,
			startDeleteAll: false,
			onDeleteAllStarted: vi.fn(),
			onDialogOpenChange: vi.fn(),
			onClose: () => {}
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Show Posts' }));

		await waitFor(() =>
			expect(navigate).toHaveBeenCalledWith({ platform: 'x', action: 'showPosts' })
		);
	});

	it('keeps the panel open on a show and marks the row that is on screen', async () => {
		const onClose = vi.fn();
		const { client, emit, settingsStore, loginStore, runner } = setup(true);
		await loadAndLogin(settingsStore, emit);
		render(XView, {
			bridge: client,
			settingsStore,
			loginStore,
			runner,
			open: true,
			startDeleteAll: false,
			onDeleteAllStarted: vi.fn(),
			onDialogOpenChange: vi.fn(),
			onClose
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Show Likes' }));

		expect(onClose).not.toHaveBeenCalled();
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Show Likes' })).toHaveAttribute(
				'aria-current',
				'page'
			)
		);
		expect(screen.getByRole('button', { name: 'Show Posts' })).not.toHaveAttribute('aria-current');
	});

	it('disables all action buttons until the host reports the user is logged in', async () => {
		const { client, emit, settingsStore, loginStore, runner } = setup(true);
		await settingsStore.load();
		render(XView, {
			bridge: client,
			settingsStore,
			loginStore,
			runner,
			open: true,
			startDeleteAll: false,
			onDeleteAllStarted: vi.fn(),
			onDialogOpenChange: vi.fn(),
			onClose: () => {}
		});

		expect(screen.getAllByRole('button', { name: /show/i })[0]).toBeDisabled();

		emit({ event: 'siteLogin', payload: { platform: 'x', loggedIn: true } });
		await waitFor(() =>
			expect(screen.getAllByRole('button', { name: /show/i })[0]).not.toBeDisabled()
		);
	});

	it('opens a confirmation dialog before deleting when confirmDeletion is enabled', async () => {
		const { client, emit, settingsStore, loginStore, runner, runAction } = setup(true);
		await loadAndLogin(settingsStore, emit);
		render(XView, {
			bridge: client,
			settingsStore,
			loginStore,
			runner,
			open: true,
			startDeleteAll: false,
			onDeleteAllStarted: vi.fn(),
			onDialogOpenChange: vi.fn(),
			onClose: () => {}
		});

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

	// The panel is the only surface the app still owns while a platform is showing, so the
	// outcome has to survive there rather than only in a toast that has already gone.
	it('keeps the panel open through a run and records its outcome', async () => {
		const onClose = vi.fn();
		const { client, emit, settingsStore, loginStore, runner } = setup(false);
		await loadAndLogin(settingsStore, emit);
		render(XView, {
			bridge: client,
			settingsStore,
			loginStore,
			runner,
			open: true,
			startDeleteAll: false,
			onDeleteAllStarted: vi.fn(),
			onDialogOpenChange: vi.fn(),
			onClose
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Delete all Posts' }));

		// The outcome lives on the runner now, which is what the status bar under the view
		// reads — the panel is no longer the thing that remembers it.
		await waitFor(() => expect(runner.lastResult.x?.message).toBe('3 posts cleaned.'));
		// Closing here took the stop button and the result away with the click that started
		// the run — the one moment the panel is worth the most.
		expect(onClose).not.toHaveBeenCalled();
	});

	// A run opens its own page, so the highlight has to follow the deletion, not the last
	// thing that was merely looked at.
	it('moves the marked row to the action being deleted', async () => {
		const { client, emit, settingsStore, loginStore, runner } = setup(false);
		await loadAndLogin(settingsStore, emit);
		render(XView, {
			bridge: client,
			settingsStore,
			loginStore,
			runner,
			open: true,
			startDeleteAll: false,
			onDeleteAllStarted: vi.fn(),
			onDialogOpenChange: vi.fn(),
			onClose: () => {}
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Show Reposts' }));
		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Show Reposts' })).toHaveAttribute('aria-current')
		);

		await fireEvent.click(screen.getByRole('button', { name: 'Delete all Replies' }));

		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Show Replies' })).toHaveAttribute(
				'aria-current',
				'page'
			)
		);
		expect(screen.getByRole('button', { name: 'Show Reposts' })).not.toHaveAttribute(
			'aria-current'
		);
	});

	it('cancelling the confirmation dialog does not run the delete action', async () => {
		const { client, emit, settingsStore, loginStore, runner, runAction } = setup(true);
		await loadAndLogin(settingsStore, emit);
		render(XView, {
			bridge: client,
			settingsStore,
			loginStore,
			runner,
			open: true,
			startDeleteAll: false,
			onDeleteAllStarted: vi.fn(),
			onDialogOpenChange: vi.fn(),
			onClose: () => {}
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Delete all Posts' }));
		expect(await screen.findByText('Delete all posts?')).toBeInTheDocument();

		await fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

		expect(runAction).not.toHaveBeenCalled();
	});

	it('deletes immediately without a dialog when confirmDeletion is disabled', async () => {
		const { client, emit, settingsStore, loginStore, runner, runAction } = setup(false);
		await loadAndLogin(settingsStore, emit);
		render(XView, {
			bridge: client,
			settingsStore,
			loginStore,
			runner,
			open: true,
			startDeleteAll: false,
			onDeleteAllStarted: vi.fn(),
			onDialogOpenChange: vi.fn(),
			onClose: () => {}
		});

		await fireEvent.click(screen.getByRole('button', { name: 'Delete all Posts' }));

		await waitFor(() =>
			expect(runAction).toHaveBeenCalledWith(
				expect.objectContaining({ platform: 'x', action: 'deletePosts' })
			)
		);
		expect(screen.queryByText('Delete all posts?')).not.toBeInTheDocument();
	});
});

/**
 * A plan the assistant wrote becomes a row here, which is the whole point of keeping one: it
 * is run months later by somebody who is not going to read the JSON again.
 */
describe('a saved action in the panel', () => {
	it('is offered beside the built-in lists and runs the plan it holds', async () => {
		const runPlan = vi.fn((params: unknown) => {
			planned.push(params);
			return { deletedCount: 4 };
		});
		const planned: unknown[] = [];
		const { settingsStore, loginStore, runner, emit, client } = setup(
			false,
			{ 'site.runPlan': runPlan },
			[SAVED_ACTION]
		);
		await loadAndLogin(settingsStore, emit);
		render(XView, {
			bridge: client,
			settingsStore,
			loginStore,
			runner,
			open: true,
			startDeleteAll: false,
			onDeleteAllStarted: () => {},
			onDialogOpenChange: () => {},
			onClose: () => {}
		});

		const row = await screen.findByRole('button', { name: /bookmarks/i });
		await fireEvent.click(row);

		await waitFor(() => expect(runPlan).toHaveBeenCalled());
		expect(planned[0]).toMatchObject({ platform: 'x', plan: SAVED_ACTION.plan });
	});

	// Deliberately outside "Delete everything": a saved plan is the user's own, it can go stale
	// on its own schedule, and sweeping it into a run that empties the account is not something
	// anyone asked for.
	it('is left out of the run that empties everything', async () => {
		const runPlan = vi.fn(() => ({ deletedCount: 0 }));
		const { settingsStore, loginStore, runner, emit, client } = setup(
			false,
			{ 'site.runPlan': runPlan },
			[SAVED_ACTION]
		);
		await loadAndLogin(settingsStore, emit);
		render(XView, {
			bridge: client,
			settingsStore,
			loginStore,
			runner,
			open: true,
			startDeleteAll: false,
			onDeleteAllStarted: () => {},
			onDialogOpenChange: () => {},
			onClose: () => {}
		});

		await fireEvent.click(await screen.findByRole('button', { name: /delete everything/i }));

		await waitFor(() => expect(screen.queryByRole('button', { name: /bookmarks/i })).toBeTruthy());
		expect(runPlan).not.toHaveBeenCalled();
	});
});
