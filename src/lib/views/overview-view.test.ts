import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import OverviewView from './overview-view.svelte';
import { SettingsStore } from '$lib/stores/settings.svelte';
import { SiteLoginStore } from '$lib/stores/site-login.svelte';
import { LogStore } from '$lib/stores/log.svelte';
import { ActionRunner } from '$lib/stores/action-runner.svelte';
import { UpdaterStore } from '$lib/stores/updater.svelte';
import { createMockHost, defaultMockHandlers } from '$lib/bridge/mock';

function setup() {
	const { client, emit } = createMockHost(defaultMockHandlers());
	return {
		emit,
		settingsStore: new SettingsStore(client),
		loginStore: new SiteLoginStore(client),
		logStore: new LogStore(client),
		runner: new ActionRunner(client),
		updater: new UpdaterStore(client)
	};
}

describe('OverviewView', () => {
	it('summarises what each platform can clean', async () => {
		const { settingsStore, loginStore, logStore, runner, updater } = setup();
		await settingsStore.load();
		render(OverviewView, {
			settingsStore,
			loginStore,
			logStore,
			runner,
			updater,
			onOpen: vi.fn(),
			onDismissIntro: vi.fn()
		});

		// The page is named by the shell's header bar now, so what proves it rendered is its
		// own first line rather than a heading it no longer repeats.
		expect(screen.getByText(/what is connected/i)).toBeInTheDocument();
		expect(screen.getByText('Following')).toBeInTheDocument();
		expect(screen.getByText('Comments')).toBeInTheDocument();
		expect(screen.getByText('Nothing is running.')).toBeInTheDocument();
	});

	it('reports the connection state the host pushed', async () => {
		const { emit, settingsStore, loginStore, logStore, runner, updater } = setup();
		await settingsStore.load();
		render(OverviewView, {
			settingsStore,
			loginStore,
			logStore,
			runner,
			updater,
			onOpen: vi.fn(),
			onDismissIntro: vi.fn()
		});

		expect(screen.getAllByText('Not signed in')).toHaveLength(2);

		emit({ event: 'siteLogin', payload: { platform: 'x', loggedIn: true } });

		await waitFor(() => expect(screen.getByText('Signed in')).toBeInTheDocument());
	});

	it('holds the intro back until the real settings have arrived', async () => {
		const { settingsStore, loginStore, logStore, runner, updater } = setup();
		render(OverviewView, {
			settingsStore,
			loginStore,
			logStore,
			runner,
			updater,
			onOpen: vi.fn(),
			onDismissIntro: vi.fn()
		});

		// Still loading: the fallback says the intro is on, and a user who switched it off
		// must not see it flash past.
		expect(screen.queryByText(/how this works/i)).not.toBeInTheDocument();

		await settingsStore.load();

		await waitFor(() => expect(screen.getByText(/how this works/i)).toBeInTheDocument());
	});

	it('opens the platform the user picked', async () => {
		const onOpen = vi.fn();
		const { settingsStore, loginStore, logStore, runner, updater } = setup();
		await settingsStore.load();
		render(OverviewView, {
			settingsStore,
			loginStore,
			logStore,
			runner,
			updater,
			onOpen,
			onDismissIntro: vi.fn()
		});

		await fireEvent.click(screen.getByRole('button', { name: /open youtube/i }));

		expect(onOpen).toHaveBeenCalledWith('youtube');
	});

	it('offers the delete-all shortcut only for a platform that is signed in', async () => {
		const onOpen = vi.fn();
		const { emit, settingsStore, loginStore, logStore, runner, updater } = setup();
		await settingsStore.load();
		render(OverviewView, {
			settingsStore,
			loginStore,
			logStore,
			runner,
			updater,
			onOpen,
			onDismissIntro: vi.fn()
		});

		expect(screen.queryByRole('button', { name: /delete everything/i })).not.toBeInTheDocument();

		emit({ event: 'siteLogin', payload: { platform: 'x', loggedIn: true } });

		const shortcut = await screen.findByRole('button', { name: /delete everything/i });
		await fireEvent.click(shortcut);

		// The overview only states the intent; the platform's own panel confirms and runs it.
		expect(onOpen).toHaveBeenCalledWith('x', { deleteAll: true });
	});

	it('announces a waiting update with its release notes', async () => {
		const { settingsStore, loginStore, logStore, runner, updater } = setup();
		await settingsStore.load();
		render(OverviewView, {
			settingsStore,
			loginStore,
			logStore,
			runner,
			updater,
			onOpen: vi.fn(),
			onDismissIntro: vi.fn()
		});

		expect(screen.queryByText(/update available/i)).not.toBeInTheDocument();

		updater.available = true;
		updater.version = '9.9.9';
		updater.notes = '### What&rsquo;s Changed\n\n* New: A thing.';

		await waitFor(() => expect(screen.getByText(/9\.9\.9/)).toBeInTheDocument());
		expect(screen.getByText('New: A thing.')).toBeInTheDocument();
	});

	it('starts the download when the update card is used', async () => {
		const { settingsStore, loginStore, logStore, runner, updater } = setup();
		await settingsStore.load();
		render(OverviewView, {
			settingsStore,
			loginStore,
			logStore,
			runner,
			updater,
			onOpen: vi.fn(),
			onDismissIntro: vi.fn()
		});

		updater.available = true;
		updater.version = '9.9.9';

		await fireEvent.click(await screen.findByRole('button', { name: /install and restart/i }));

		const bar = await screen.findByRole('progressbar');
		expect(bar).toHaveAttribute('aria-label', 'Downloading update 9.9.9');
	});
});
