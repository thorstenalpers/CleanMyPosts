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
	emit: undefined as undefined | ((event: unknown) => void)
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
						return (handler as (p: unknown) => unknown)(params);
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
			themePreset: 'Default',
			showAssistant: true,
			assistantSource: 'claude-code',
			assistantCliPath: '',
			timeouts: {
				waitAfterDelete: 500,
				waitBetweenRetryDeleteAttempts: 500,
				waitAfterDocumentLoad: 3000
			}
		}
	});
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
		url.pathname = '/';
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

	it('opens the actions beside the sidebar, and only on demand', async () => {
		url.pathname = '/x';
		await renderLayout();

		// Being on a platform is not enough — the actions cost their width only while open.
		expect(screen.queryByRole('complementary', { name: 'X actions' })).not.toBeInTheDocument();

		await fireEvent.click(screen.getByRole('button', { name: /^X/ }));
		expect(await screen.findByRole('complementary', { name: 'X actions' })).toBeInTheDocument();

		// What "beside" buys: opening X leaves YouTube exactly where it was.
		const x = screen.getByRole('button', { name: /^X/ });
		const youtube = screen.getByRole('button', { name: /^YouTube/ });
		expect(x.nextElementSibling).toBe(youtube);

		await fireEvent.click(x);
		await waitFor(() =>
			expect(screen.queryByRole('complementary', { name: 'X actions' })).not.toBeInTheDocument()
		);
	});

	it('closes the actions from the panel itself as well as from the nav item', async () => {
		url.pathname = '/x';
		await renderLayout();

		await fireEvent.click(screen.getByRole('button', { name: /^X/ }));
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

	it('pulls in every route once the overview is up', async () => {
		await renderLayout();

		await waitFor(() => expect(preloadCode).toHaveBeenCalledWith('/settings'));
		for (const path of ['/', '/x', '/youtube', '/log']) {
			expect(preloadCode).toHaveBeenCalledWith(path);
		}
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

	it('hides the site on the local pages so they are not covered by it', async () => {
		await renderLayout();

		await waitFor(() =>
			expect(host.calls).toContainEqual({ method: 'site.hide', params: { hide: true } })
		);
	});
});
