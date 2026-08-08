import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import './content-entry';

describe('window.__cmp', () => {
	let postMessage: ReturnType<typeof vi.fn<(message: unknown) => void>>;

	beforeEach(() => {
		postMessage = vi.fn();
		window.chrome = {
			webview: { postMessage, addEventListener: vi.fn(), removeEventListener: vi.fn() }
		};
	});

	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('is registered on window', () => {
		expect(window.__cmp).toBeDefined();
	});

	it('isEmpty delegates to the matching action definition', () => {
		expect(window.__cmp!.isEmpty('x', 'deletePosts')).toBe(true);
		document.body.innerHTML = '<article></article>';
		expect(window.__cmp!.isEmpty('x', 'deletePosts')).toBe(false);
	});

	it('run posts an error (not a silent hang) for an unknown action', () => {
		window.__cmp!.run(
			'x',
			'deleteEverything' as never,
			JSON.stringify({ requestId: 'r1', waitAfterDelete: 1, waitBetweenRetryDeleteAttempts: 1 })
		);

		expect(postMessage).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'error', requestId: 'r1' })
		);
	});

	it('run posts done with deletedCount 0 when there is nothing to delete', async () => {
		window.__cmp!.run(
			'x',
			'deletePosts',
			JSON.stringify({ requestId: 'r2', waitAfterDelete: 1, waitBetweenRetryDeleteAttempts: 1 })
		);

		await vi.waitFor(
			() =>
				expect(postMessage).toHaveBeenCalledWith({
					type: 'done',
					requestId: 'r2',
					deletedCount: 0
				}),
			{ timeout: 8000 }
		);
	}, 10000);

	/**
	 * A click on the platform's own navigation mid-run leaves the list being emptied, and the
	 * run then reports an account that is already clean. The page has to stop taking input.
	 */
	it('covers the page while a run is going and uncovers it when it ends', async () => {
		const shielded = () => !!document.body.querySelector('div[style*="not-allowed"]');

		expect(shielded()).toBe(false);

		window.__cmp!.run(
			'x',
			'deletePosts',
			JSON.stringify({ requestId: 'r3', waitAfterDelete: 1, waitBetweenRetryDeleteAttempts: 1 })
		);
		expect(shielded()).toBe(true);

		await vi.waitFor(
			() => expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({ requestId: 'r3' })),
			{ timeout: 8000 }
		);
		await vi.waitFor(() => expect(shielded()).toBe(false));
	}, 10000);

	// The host arms it while it waits for a list page to settle: the stop button is already up
	// and the counter already running, but the engine has not been handed the page yet.
	it('lets the host cover the page before a run of its own has started', () => {
		const shielded = () => !!document.body.querySelector('div[style*="not-allowed"]');

		window.__cmp!.shield(true);
		expect(shielded()).toBe(true);

		window.__cmp!.shield(false);
		expect(shielded()).toBe(false);
	});

	it('getUserName and getLoginStatus are exposed', () => {
		expect(typeof window.__cmp!.getUserName()).toBe('string');
		expect(typeof window.__cmp!.getLoginStatus()).toBe('string');
	});
});

describe('telling the two platforms apart', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	function on(host: string): void {
		Object.defineProperty(window, 'location', {
			value: { host, href: `https://${host}/` },
			writable: true,
			configurable: true
		});
	}

	// The rule this exists for: a substring test also accepts "x.com.example.net".
	it('reads a host that merely contains x.com as YouTube, not as X', () => {
		document.body.innerHTML = '<button id="avatar-btn"><img src="https://e.test/a.png" /></button>';
		on('x.com.example.net');

		expect(window.__cmp!.getLoginStatus()).toBe('logged_in');
	});

	it('still recognises x.com and its subdomains', () => {
		document.body.innerHTML = '<a data-testid="AppTabBar_Profile_Link" href="/someone"></a>';
		on('x.com');
		expect(window.__cmp!.getLoginStatus()).toBe('logged_in');

		on('mobile.x.com');
		expect(window.__cmp!.getLoginStatus()).toBe('logged_in');
	});
});
