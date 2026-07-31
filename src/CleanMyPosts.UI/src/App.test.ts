import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import App from './App.svelte';

async function renderApp() {
  render(App);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Log' })).toBeInTheDocument());
}

const filterInput = () => screen.getByPlaceholderText(/filter messages/i);

describe('App navigation', () => {
  it('keeps the log filters when navigating away and back', async () => {
    await renderApp();

    await fireEvent.click(screen.getByRole('button', { name: 'Log' }));
    await fireEvent.input(filterInput(), { target: { value: 'boom' } });
    await fireEvent.click(screen.getByRole('button', { name: 'Error' }));

    await fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Log' }));

    expect(filterInput()).toHaveValue('boom');
    expect(screen.getByRole('button', { name: 'Error' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('keeps the inactive page mounted but inert', async () => {
    await renderApp();

    await fireEvent.click(screen.getByRole('button', { name: 'Log' }));
    expect(filterInput().closest('div[inert]')).toBeNull();

    await fireEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(filterInput().closest('div[inert]')).not.toBeNull();
  });
});
