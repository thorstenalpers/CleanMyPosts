import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';

const goto = vi.fn();
const url = { pathname: '/' };

const preloadCode = vi.fn();

vi.mock('$app/navigation', () => ({
	goto: (path: string) => {
		goto(path);
	},
	preloadCode: (path: string) => {
		preloadCode(path);
		return Promise.resolve();
	}
}));
vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));
vi.mock('$app/state', () => ({
	get page() {
		return { url };
	}
}));

// The layout builds its own mock host, so the only seam to watch what it asks the host for
// is the handler table it passes in.
const host = vi.hoisted(() => ({
	calls: [] as { method: string; params: unknown }[],
	emit: undefined as undefined | ((event: unknown) => void),
	/** Merged into whatever `settings.get` answers, so a test can start from a switch that is off. */
	settingsPatch: {}
}));

vi.mock('$lib/bridge/mock', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/bridge/mock')>();
	return {
		...actual,
		createMockHost: (handlers: Parameters<typeof actual.createMockHost>[0]) => {
			const made = actual.createMockHost(handlers);
			host.emit = made.emit as (event: unknown) => void;
			return made;
		},
		defaultMockHandlers: () =>
			Object.fromEntries(
				Object.entries(actual.defaultMockHandlers()).map(([method, handler]) => [
					method,
					(params: unknown) => {
						host.calls.push({ method, params });
						const result = (handler as (p: unknown) => unknown)(params);
						return method === 'settings.get'
							? { ...(result as object), ...host.settingsPatch }
							: result;
					}
				])
			)
	};
});

const Layout = (await import('./+layout.svelte')).default;

/** The host is what tells the app a setting changed, so that is the seam the tests use. */
function hideYouTube() {
	host.emit?.({
		event: 'settingsChanged',
		payload: {
			theme: 'Default',
			language: 'System',
			showIntro: true,
			showLogs: true,
			showX: true,
			showYouTube: false,
			confirmDeletion: true,
			notifications: true,
			debugLogging: false,
			autoConsent: true,
			persistSession: true,
			checkUpdatesOnStart: true,
			themePreset: 'default',
			showAssistant: true,
			assistantSource: 'claude-code',
			assistantCliPath: '',
			engineScript: '',
			timeouts: {
				waitAfterDelete: 500,
				waitBetweenRetryDeleteAttempts: 500,
				waitAfterDocumentLoad: 3000
			}
		}
	});
}

/** The shell reads the window, so that is what a test has to move. */
function resizeTo(width: number) {
	window.innerWidth = width;
	return fireEvent(window, new Event('resize'));
}

async function renderLayout() {
	render(Layout, { children: createRawSnippet(() => ({ render: () => '<div></div>' })) });
	await waitFor(() => expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument());
}

describe('app layout', () => {
	beforeEach(() => {
		goto.mockClear();
		preloadCode.mockClear();
		host.calls.length = 0;
		host.settingsPatch = {};
		url.pathname = '/';
		window.innerWidth = 1200;
	});

	it('asks the release feed for a newer version at start-up', async () => {
		await renderLayout();

		await waitFor(() =>
			expect(host.calls.map((call) => call.method)).toContain('updater.checkForUpdates')
		);
	});

	it('asks nothing when the start-up check is switched off', async () => {
		host.settingsPatch = { checkUpdatesOnStart: false };
		await renderLayout();

		// Waiting on a request that must not happen: settle everything the start does, then look.
		await waitFor(() => expect(host.calls.map((call) => call.method)).toContain('log.getBuffer'));
		expect(host.calls.map((call) => call.method)).not.toContain('updater.checkForUpdates');
	});

	it('routes to the page a sidebar item stands for', async () => {
		await renderLayout();

		await fireEvent.click(screen.getByRole('button', { name: 'Log' }));

		expect(goto).toHaveBeenCalledWith('/log');
	});

	it('marks the item matching the current route as active', async () => {
		url.pathname = '/log';
		await renderLayout();

		expect(screen.getByRole('button', { name: 'Log' })).toHaveAttribute('aria-current', 'page');
	});

	it('serves the overview at the root and settings at its own route', async () => {
		await renderLayout();

		expect(screen.getByRole('button', { name: 'Overview' })).toHaveAttribute(
			'aria-current',
			'page'
		);

		await fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
		expect(goto).toHaveBeenCalledWith('/settings');
	});

	it('keeps the actions beside the sidebar for as long as a platform is up', async () => {
		url.pathname = '/x';
		await renderLayout();

		// Being on a platform is enough: the actions are what the platform is for, and the panel
		// carries the running deletion, its stop button and its result.
		expect(await screen.findByRole('complementary', { name: 'X actions' })).toBeInTheDocument();

		// What "beside" buys: opening X leaves YouTube exactly where it was.
		const x = screen.getByRole('button', { name: /^X/ });
		const youtube = screen.getByRole('button', { name: /^YouTube/ });
		expect(x.nextElementSibling).toBe(youtube);

		// A second click on the same nav item does not take them away again.
		await fireEvent.click(x);
		expect(screen.getByRole('complementary', { name: 'X actions' })).toBeInTheDocument();
	});

	it('closes the actions from the panel itself, and only from there', async () => {
		url.pathname = '/x';
		await renderLayout();

		await screen.findByRole('complementary', { name: 'X actions' });

		await fireEvent.click(screen.getByRole('button', { name: 'Close X actions' }));

		await waitFor(() =>
			expect(screen.queryByRole('complementary', { name: 'X actions' })).not.toBeInTheDocument()
		);
	});

	it('shows a platform without navigating its webview', async () => {
		url.pathname = '/x';
		await renderLayout();

		await waitFor(() =>
			expect(host.calls).toContainEqual({ method: 'site.show', params: { platform: 'x' } })
		);
		// The regression this guards: navigating on every visit reloads the page the user
		// was on, which is exactly the state they expect to come back to.
		expect(host.calls.filter((call) => call.method === 'site.navigate')).toHaveLength(0);
	});

	it('pulls in every route without waiting for the stores', async () => {
		await renderLayout();

		await waitFor(() => expect(preloadCode).toHaveBeenCalledWith('/settings'));
		for (const path of ['/', '/x', '/youtube', '/log', '/info']) {
			expect(preloadCode).toHaveBeenCalledWith(path);
		}
	});

	// The page module can still be in flight when the click lands; the sidebar says where the
	// user is going anyway, instead of looking like it missed the click.
	it('marks a clicked item active before the route has caught up', async () => {
		await renderLayout();

		await fireEvent.click(screen.getByRole('button', { name: 'Settings' }));

		expect(screen.getByRole('button', { name: 'Settings' })).toHaveAttribute(
			'aria-current',
			'page'
		);
		expect(screen.getByRole('button', { name: 'Overview' })).not.toHaveAttribute('aria-current');
	});

	it('drops a platform from the sidebar when it is switched off', async () => {
		await renderLayout();

		expect(screen.getByRole('button', { name: /^YouTube/ })).toBeInTheDocument();

		hideYouTube();

		await waitFor(() =>
			expect(screen.queryByRole('button', { name: /^YouTube/ })).not.toBeInTheDocument()
		);
		// X is untouched — the two switches are independent.
		expect(screen.getByRole('button', { name: /^X/ })).toBeInTheDocument();
	});

	it('sends you home when the route you are standing on is switched off', async () => {
		url.pathname = '/youtube';
		await renderLayout();

		goto.mockClear();
		hideYouTube();

		await waitFor(() => expect(goto).toHaveBeenCalledWith('/'));
	});

	// The header's own dropdown is taller than the strip the chrome keeps while a platform is
	// showing, so it would open behind that webview and look like a broken button.
	it('gets the platform out of the way while a header menu is open', async () => {
		url.pathname = '/x';
		await renderLayout();
		await waitFor(() =>
			expect(host.calls).toContainEqual({ method: 'site.show', params: { platform: 'x' } })
		);
		host.calls.length = 0;

		await fireEvent.click(screen.getByRole('button', { name: /language|sprache/i }));

		await waitFor(() =>
			expect(host.calls).toContainEqual({ method: 'site.hide', params: { hide: true } })
		);
	});

	it('folds the sidebar to its rail on a window with no room for it', async () => {
		await renderLayout();
		expect(screen.getByRole('button', { name: 'Collapse menu' })).toBeInTheDocument();

		await resizeTo(900);

		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Expand menu' })).toBeInTheDocument()
		);
	});

	it('gives the sidebar back the moment there is room for it again', async () => {
		await renderLayout();
		await resizeTo(900);
		await waitFor(() => expect(screen.getByRole('button', { name: 'Expand menu' })).toBeTruthy());

		await resizeTo(1200);

		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'Collapse menu' })).toBeInTheDocument()
		);
	});

	// The window folds it, it does not hold it shut: someone who wants the labels on a small
	// window is asking for them, and the toggle has to answer.
	it('leaves the toggle working while the window stays narrow', async () => {
		await renderLayout();
		await resizeTo(900);
		await waitFor(() => expect(screen.getByRole('button', { name: 'Expand menu' })).toBeTruthy());

		await fireEvent.click(screen.getByRole('button', { name: 'Expand menu' }));

		expect(screen.getByRole('button', { name: 'Collapse menu' })).toBeInTheDocument();
	});

	it('takes the actions away on a window too narrow for the column, and keeps a way back', async () => {
		url.pathname = '/x';
		await renderLayout();
		await screen.findByRole('complementary', { name: 'X actions' });

		await resizeTo(700);

		await waitFor(() =>
			expect(screen.queryByRole('complementary', { name: 'X actions' })).not.toBeInTheDocument()
		);

		// The panel's own ✕ went with it, so the header carries the way in.
		await fireEvent.click(screen.getByRole('button', { name: 'Open X actions' }));

		expect(await screen.findByRole('complementary', { name: 'X actions' })).toBeInTheDocument();
	});

	it('hides the site on the local pages so they are not covered by it', async () => {
		await renderLayout();

		await waitFor(() =>
			expect(host.calls).toContainEqual({ method: 'site.hide', params: { hide: true } })
		);
	});
});
