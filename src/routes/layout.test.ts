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
	settingsPatch: {},
	/** A machine with neither the binary nor a key — the state a fresh install is in. */
	noAssistantSource: false
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
						if (method === 'settings.get') return { ...(result as object), ...host.settingsPatch };
						if (method === 'assistant.getSources' && host.noAssistantSource)
							return {
								local: { found: false, path: null, version: null },
								providers: [
									{
										id: 'gemini',
										label: 'Google AI',
										model: '',
										freeKeyUrl: '',
										hasKey: false
									}
								]
							};
						return result;
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
			assistantModel: '',
			assistantEffort: 'medium',
			customActions: [],
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

/**
 * The panel lives in the column the app owns rather than floating over the platform page.
 * Anything floating there would be painted behind a webview that is laid on top of this one —
 * the same reason every dialog in this app pushes the platform off screen first.
 */
describe('the assistant panel', () => {
	// Its own reset: this block sits outside the one above, and the width a previous test left
	// behind would fold the sidebar and change the number under test.
	beforeEach(() => {
		host.calls.length = 0;
		host.settingsPatch = {};
		url.pathname = '/';
		window.innerWidth = 1200;
		host.noAssistantSource = false;
	});

	// Hidden rather than shown and refusing: without a source the assistant cannot answer, and
	// the app deletes without it. The settings are the one place that says a key is missing.
	it('is nowhere in the app while nothing can answer', async () => {
		host.noAssistantSource = true;
		url.pathname = '/x';
		await renderLayout();

		await waitFor(() =>
			expect(host.calls.some((call) => call.method === 'assistant.getSources')).toBe(true)
		);
		expect(screen.queryByRole('button', { name: 'Assistant' })).not.toBeInTheDocument();
		expect(screen.queryByRole('link', { name: 'Assistant' })).not.toBeInTheDocument();
	});

	// Reachability follows the sidebar, so the page a hidden entry led to sends the user home
	// instead of standing there empty.
	it('sends the assistant page home while nothing can answer', async () => {
		host.noAssistantSource = true;
		url.pathname = '/assistant';
		await renderLayout();

		await waitFor(() => expect(goto).toHaveBeenCalledWith('/'));
	});

	it('opens beside the platform from the header, and closes on its own button', async () => {
		url.pathname = '/x';
		await renderLayout();

		expect(screen.queryByRole('complementary', { name: /assistant/i })).not.toBeInTheDocument();

		await fireEvent.click(screen.getByRole('button', { name: 'Assistant', pressed: false }));

		const panel = await screen.findByRole('complementary', { name: /assistant/i });
		expect(panel).toBeInTheDocument();
		// Beside, not instead of: the platform's own actions are still there next to it.
		expect(screen.getByRole('complementary', { name: 'X actions' })).toBeInTheDocument();

		await fireEvent.click(screen.getByRole('button', { name: /close the assistant/i }));

		await waitFor(() =>
			expect(screen.queryByRole('complementary', { name: /assistant/i })).not.toBeInTheDocument()
		);
	});

	// The host has to shorten the site webview by exactly what the app is covering, or the page
	// renders under a column it cannot see.
	it('tells the host that the site starts further in while it is open', async () => {
		url.pathname = '/x';
		await renderLayout();
		await waitFor(() => expect(host.calls.some((call) => call.method === 'layout.setSiteInset')));
		host.calls.length = 0;

		await fireEvent.click(screen.getByRole('button', { name: 'Assistant', pressed: false }));

		await waitFor(() => {
			const inset = host.calls
				.filter((call) => call.method === 'layout.setSiteInset')
				.map((call) => call.params as { left: number })
				.pop();
			expect(inset?.left).toBe(240 + 224 + 320);
		});
	});

	// Below the width where the action column already steps aside there is no room for a second
	// one either, so it folds with it rather than squeezing the page to nothing.
	it('folds away on a window too narrow to hold it', async () => {
		url.pathname = '/x';
		await renderLayout();
		await fireEvent.click(screen.getByRole('button', { name: 'Assistant', pressed: false }));
		await screen.findByRole('complementary', { name: /assistant/i });

		await resizeTo(700);

		await waitFor(() =>
			expect(screen.queryByRole('complementary', { name: /assistant/i })).not.toBeInTheDocument()
		);
	});
});

/**
 * Arabic mirrors the whole shell with one `dir` on `<html>`, which puts every column the app
 * owns against the other edge. The host places the platform webview in physical pixels and
 * cannot see that, so it has to be told. Getting it wrong does not look like a layout slip:
 * the platform covers the sidebar and the app appears to have lost its menu — which is only
 * visible on X and YouTube, because everywhere else the platform is hidden.
 */
describe('a mirrored shell', () => {
	// Its own reset: this block sits outside the one above, and the width a previous test left
	// behind would fold the sidebar and change the number under test.
	beforeEach(() => {
		host.calls.length = 0;
		host.settingsPatch = {};
		url.pathname = '/';
		window.innerWidth = 1200;
	});

	function speak(language: string) {
		host.emit?.({
			event: 'settingsChanged',
			payload: {
				theme: 'Default',
				language,
				showIntro: true,
				showLogs: true,
				showX: true,
				showYouTube: true,
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
				assistantModel: '',
				assistantEffort: 'medium',
				customActions: [],
				timeouts: {
					waitAfterDelete: 500,
					waitBetweenRetryDeleteAttempts: 500,
					waitAfterDocumentLoad: 3000
				}
			}
		});
	}

	function lastInset() {
		return host.calls
			.filter((call) => call.method === 'layout.setSiteInset')
			.map((call) => call.params as { left: number; rtl: boolean })
			.pop();
	}

	it('tells the host which side its columns are on', async () => {
		url.pathname = '/x';
		await renderLayout();
		await waitFor(() => expect(lastInset()).toBeDefined());
		expect(lastInset()?.rtl).toBe(false);

		speak('ar');

		await waitFor(() => expect(lastInset()?.rtl).toBe(true));
		// The width is the same either way — it is the edge that moved, not the columns.
		expect(lastInset()?.left).toBe(240 + 224);
	});

	it('says so again when the language goes back', async () => {
		url.pathname = '/x';
		await renderLayout();
		speak('ar');
		await waitFor(() => expect(lastInset()?.rtl).toBe(true));

		speak('de');

		await waitFor(() => expect(lastInset()?.rtl).toBe(false));
	});
});
