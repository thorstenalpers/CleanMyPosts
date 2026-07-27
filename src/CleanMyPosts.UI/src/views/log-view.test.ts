import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/svelte';
import LogView from './log-view.svelte';
import { LogStore } from '$lib/stores/log.svelte';
import { createMockHost } from '$lib/bridge/mock';
import type { LogEntry } from '$lib/bridge/contract';

const entries: LogEntry[] = [
  { timestamp: '2026-07-24T10:00:00.000Z', level: 'info', message: 'first message' },
  { timestamp: '2026-07-24T10:00:05.000Z', level: 'error', message: 'second message boom' },
  { timestamp: '2026-07-24T10:00:10.000Z', level: 'warning', message: 'third message' }
];

async function setup() {
  const { client } = createMockHost({ 'log.getBuffer': () => entries });
  const logStore = new LogStore(client);
  await logStore.load();
  return logStore;
}

describe('LogView', () => {
  it('renders every buffered log entry', async () => {
    const logStore = await setup();
    render(LogView, { logStore });

    expect(screen.getByText('first message')).toBeInTheDocument();
    expect(screen.getByText('second message boom')).toBeInTheDocument();
    expect(screen.getByText('third message')).toBeInTheDocument();
  });

  it('filters by message text', async () => {
    const logStore = await setup();
    render(LogView, { logStore });

    await fireEvent.input(screen.getByPlaceholderText(/filter messages/i), { target: { value: 'boom' } });

    expect(screen.queryByText('first message')).not.toBeInTheDocument();
    expect(screen.getByText('second message boom')).toBeInTheDocument();
  });

  it('filters by level', async () => {
    const logStore = await setup();
    render(LogView, { logStore });

    await fireEvent.click(screen.getByRole('button', { name: 'Error' }));

    expect(screen.queryByText('first message')).not.toBeInTheDocument();
    expect(screen.getByText('second message boom')).toBeInTheDocument();
    expect(screen.queryByText('third message')).not.toBeInTheDocument();
  });

  it('clears all entries when Clear is clicked', async () => {
    const logStore = await setup();
    render(LogView, { logStore });

    await fireEvent.click(screen.getByRole('button', { name: /clear/i }));

    await waitFor(() => expect(screen.getByText('No log entries.')).toBeInTheDocument());
  });

  it('toggles sort order when the Time header is clicked', async () => {
    const logStore = await setup();
    render(LogView, { logStore });

    const rowsMessagesInOrder = () =>
      screen.getAllByRole('row').slice(1).map((row) => within(row).getAllByRole('cell')[2]?.textContent);

    // Default sort is timestamp desc: newest ("third") first.
    expect(rowsMessagesInOrder()[0]).toContain('third message');

    await fireEvent.click(screen.getByRole('button', { name: /time/i }));

    await waitFor(() => expect(rowsMessagesInOrder()[0]).toContain('first message'));
  });
});
