import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';

const goto = vi.fn();
const url = { pathname: '/settings' };

vi.mock('$app/navigation', () => ({
	goto: (path: string) => {
		goto(path);
	}
}));
vi.mock('$app/paths', () => ({ resolve: (path: string) => path }));
vi.mock('$app/state', () => ({
	get page() {
		return { url };
	}
}));

const Layout = (await import('./+layout.svelte')).default;

async function renderLayout() {
	render(Layout, { children: createRawSnippet(() => ({ render: () => '<div></div>' })) });
	await waitFor(() => expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument());
}

describe('app layout', () => {
	beforeEach(() => {
		goto.mockClear();
		url.pathname = '/settings';
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
});
