import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import OverviewView from './overview-view.svelte';
import { SettingsStore } from '$lib/stores/settings.svelte';
import { SiteLoginStore } from '$lib/stores/site-login.svelte';
import { LogStore } from '$lib/stores/log.svelte';
import { ActionRunner } from '$lib/stores/action-runner.svelte';
import { createMockHost, defaultMockHandlers } from '$lib/bridge/mock';

function setup() {
	const { client, emit } = createMockHost(defaultMockHandlers());
	return {
		emit,
		settingsStore: new SettingsStore(client),
		loginStore: new SiteLoginStore(client),
		logStore: new LogStore(client),
		runner: new ActionRunner(client)
	};
}

describe('OverviewView', () => {
	it('summarises what each platform can clean', async () => {
		const { settingsStore, loginStore, logStore, runner } = setup();
		await settingsStore.load();
		render(OverviewView, {
			settingsStore,
			loginStore,
			logStore,
			runner,
			onOpen: vi.fn(),
			onDismissIntro: vi.fn()
		});

		expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
		expect(screen.getByText('Following')).toBeInTheDocument();
		expect(screen.getByText('Comments')).toBeInTheDocument();
		expect(screen.getByText('Nothing is running.')).toBeInTheDocument();
	});

	it('reports the connection state the host pushed', async () => {
		const { emit, settingsStore, loginStore, logStore, runner } = setup();
		await settingsStore.load();
		render(OverviewView, {
			settingsStore,
			loginStore,
			logStore,
			runner,
			onOpen: vi.fn(),
			onDismissIntro: vi.fn()
		});

		expect(screen.getAllByText('Not signed in')).toHaveLength(2);

		emit({ event: 'siteLogin', payload: { platform: 'x', loggedIn: true } });

		await waitFor(() => expect(screen.getByText('Signed in')).toBeInTheDocument());
	});

	it('opens the platform the user picked', async () => {
		const onOpen = vi.fn();
		const { settingsStore, loginStore, logStore, runner } = setup();
		await settingsStore.load();
		render(OverviewView, {
			settingsStore,
			loginStore,
			logStore,
			runner,
			onOpen,
			onDismissIntro: vi.fn()
		});

		await fireEvent.click(screen.getByRole('button', { name: /open youtube/i }));

		expect(onOpen).toHaveBeenCalledWith('youtube');
	});
});
