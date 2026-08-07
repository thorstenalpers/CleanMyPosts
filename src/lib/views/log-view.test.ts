import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
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

	it('keeps entries in arrival order, newest last', async () => {
		const logStore = await setup();
		render(LogView, { logStore });

		const messages = screen.getAllByRole('row').map((row) => row.textContent);

		expect(messages[1]).toContain('first message');
		expect(messages[messages.length - 1]).toContain('third message');
	});

	it('sorts by a column, and back, when its header is clicked', async () => {
		const logStore = await setup();
		render(LogView, { logStore });

		await fireEvent.click(screen.getByRole('button', { name: /sort by time/i }));
		let rows = screen.getAllByRole('row').map((row) => row.textContent);
		expect(rows[1]).toContain('third message');

		await fireEvent.click(screen.getByRole('button', { name: /sort by time/i }));
		rows = screen.getAllByRole('row').map((row) => row.textContent);
		expect(rows[1]).toContain('first message');
	});

	it('filters by message text', async () => {
		const logStore = await setup();
		render(LogView, { logStore });

		await fireEvent.input(screen.getByLabelText(/filter log messages/i), {
			target: { value: 'boom' }
		});

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

	it('summarises warnings and errors in the header', async () => {
		const logStore = await setup();
		render(LogView, { logStore });

		expect(screen.getByText('1 errors')).toBeInTheDocument();
		expect(screen.getByText('1 warnings')).toBeInTheDocument();
	});

	it('clears all entries when Clear is clicked', async () => {
		const logStore = await setup();
		render(LogView, { logStore });

		await fireEvent.click(screen.getByRole('button', { name: /clear/i }));

		await waitFor(() => expect(screen.getByText('Nothing logged yet.')).toBeInTheDocument());
	});
});
