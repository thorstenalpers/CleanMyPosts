import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/svelte';
import BootSplash from './boot-splash.svelte';

describe('boot splash', () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('covers the start for the full minimum, however fast the app is', async () => {
		const { container } = render(BootSplash, { minimumMs: 3000 });
		// Queried directly: once it starts leaving it is aria-hidden, and role queries drop it.
		const splash = () => container.querySelector('[role="status"]');

		expect(splash()).not.toBeNull();
		expect(splash()!.className).not.toContain('opacity-0');

		await vi.advanceTimersByTimeAsync(2900);
		expect(splash()!.className).not.toContain('opacity-0');

		await vi.advanceTimersByTimeAsync(200);
		expect(splash()!.className).toContain('opacity-0');
	});

	// The regression this exists for: removal used to hang off `transitionend`, and this app
	// parks its webview where frames stop coming — the splash then stays forever, invisible.
	it('leaves the dom on a timer, not on a transition that may never run', async () => {
		const { container } = render(BootSplash, { minimumMs: 3000 });

		await vi.advanceTimersByTimeAsync(3600);

		expect(container.querySelector('[role="status"]')).toBeNull();
	});
});
