import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
	delay,
	isVisible,
	waitFor,
	waitForByScrolling,
	postLog,
	postProgress,
	postDone,
	clickWithCursor,
	hideCursor,
	postMarkup
} from './dom';
import { readFileSync } from 'node:fs';

describe('delay', () => {
	it('resolves after the given time', async () => {
		vi.useFakeTimers();
		const spy = vi.fn();
		void delay(1000).then(spy);

		await vi.advanceTimersByTimeAsync(999);
		expect(spy).not.toHaveBeenCalled();

		await vi.advanceTimersByTimeAsync(1);
		expect(spy).toHaveBeenCalled();
		vi.useRealTimers();
	});
});

describe('isVisible', () => {
	it('is false for null', () => {
		expect(isVisible(null)).toBe(false);
	});

	it('is false for a disabled button', () => {
		const btn = document.createElement('button');
		btn.disabled = true;
		document.body.append(btn);
		expect(isVisible(btn)).toBe(false);
		btn.remove();
	});

	it('is true for an element with client rects', () => {
		const div = document.createElement('div');
		div.getClientRects = () => [{} as DOMRect] as unknown as DOMRectList;
		expect(isVisible(div)).toBe(true);
	});
});

describe('waitFor', () => {
	it('returns the truthy value as soon as check succeeds', async () => {
		let calls = 0;
		const result = await waitFor(
			() => {
				calls++;
				return calls >= 3 ? 'found' : undefined;
			},
			{ intervalMs: 1, maxWaitMs: 1000 }
		);

		expect(result).toBe('found');
		expect(calls).toBe(3);
	});

	it('returns undefined once maxWaitMs elapses', async () => {
		const result = await waitFor(() => undefined, { intervalMs: 1, maxWaitMs: 5 });
		expect(result).toBeUndefined();
	});

	it('calls onTick on every unsuccessful attempt', async () => {
		const onTick = vi.fn();
		await waitFor(() => undefined, { intervalMs: 1, maxWaitMs: 5, onTick });
		expect(onTick.mock.calls.length).toBeGreaterThan(0);
	});
});

describe('waitForByScrolling', () => {
	it('scrolls the window on every unsuccessful tick', async () => {
		const scrollSpy = vi.spyOn(window, 'scrollBy').mockImplementation(() => undefined);
		await waitForByScrolling(() => undefined, 400, { intervalMs: 1, maxWaitMs: 5 });
		expect(scrollSpy).toHaveBeenCalledWith(0, 400);
		scrollSpy.mockRestore();
	});
});

describe('post* helpers', () => {
	let postMessage: ReturnType<typeof vi.fn<(message: unknown) => void>>;

	beforeEach(() => {
		postMessage = vi.fn();
		window.chrome = {
			webview: { postMessage, addEventListener: vi.fn(), removeEventListener: vi.fn() }
		};
	});

	it('postLog posts a log message', () => {
		postLog('warning', 'careful');
		expect(postMessage).toHaveBeenCalledWith({ type: 'log', level: 'warning', message: 'careful' });
	});

	it('postProgress posts a progress message', () => {
		postProgress('req-1', 4, 'four so far');
		expect(postMessage).toHaveBeenCalledWith({
			type: 'progress',
			requestId: 'req-1',
			deletedCount: 4,
			message: 'four so far'
		});
	});

	it('postDone posts a done message', () => {
		postDone('req-1', 9);
		expect(postMessage).toHaveBeenCalledWith({ type: 'done', requestId: 'req-1', deletedCount: 9 });
	});

	it('is a no-op when no WebView2 host is present', () => {
		window.chrome = undefined;
		expect(() => postLog('info', 'noop')).not.toThrow();
	});
});

describe('the pointer', () => {
	beforeEach(() => {
		document.body.innerHTML = '';
		hideCursor();
	});

	it('draws itself without any markup string', () => {
		const target = document.createElement('button');
		document.body.append(target);

		clickWithCursor(target);

		const svg = document.querySelector('svg');
		expect(svg?.namespaceURI).toBe('http://www.w3.org/2000/svg');
		expect(svg?.querySelectorAll('circle')).toHaveLength(2);
	});

	/**
	 * YouTube's newer menu entries commit on pointer events; a bare `click()` left them
	 * unmoved. Opt-in, because on a toggle the extra `pointerdown` counts as a second
	 * activation and closes what the click just opened.
	 */
	it('sends the pointer sequence a real mouse would when asked to', () => {
		const target = document.createElement('button');
		document.body.append(target);
		const seen: string[] = [];
		for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) {
			target.addEventListener(type, () => seen.push(type));
		}

		clickWithCursor(target, { pointerSequence: true });

		expect(seen).toEqual(['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']);
	});

	it('sends a plain click by default, so a toggle is not activated twice', () => {
		const target = document.createElement('button');
		document.body.append(target);
		const seen: string[] = [];
		for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) {
			target.addEventListener(type, () => seen.push(type));
		}

		clickWithCursor(target);

		expect(seen).toEqual(['click']);
	});

	/**
	 * YouTube ships `require-trusted-types-for 'script'`, where assigning `innerHTML` throws
	 * and takes the whole run with it. Nothing the engine injects may reach for it.
	 */
	it('leaves innerHTML alone anywhere in the engine', () => {
		const sources = [
			'src/lib/engine/dom.ts',
			'src/lib/engine/consent.ts',
			'src/lib/engine/content-entry.ts'
		];

		for (const path of sources) {
			expect(readFileSync(path, 'utf8')).not.toMatch(/\.innerHTML\s*=/);
		}
	});
});

describe('postMarkup', () => {
	const postMessage = vi.fn();

	beforeEach(() => {
		document.body.innerHTML = '';
		postMessage.mockClear();
		window.chrome = {
			webview: { postMessage, addEventListener: vi.fn(), removeEventListener: vi.fn() }
		};
	});

	/** The one message sent, typed the way the rest of this file reads them. */
	function sentMessage(): { level: string; message: string } {
		return postMessage.mock.calls[0]?.[0] as { level: string; message: string };
	}

	/** The one failure that cannot be reasoned about afterwards: the page is gone by then. */
	it('carries the element that a selector failed against', () => {
		document.body.innerHTML = '<div id="contents"><span>a row</span></div>';

		postMarkup('The list', document.querySelector('#contents'));

		const sent = sentMessage();
		expect(sent.level).toBe('debug');
		expect(sent.message).toContain('The list');
		expect(sent.message).toContain('<span>a row</span>');
	});

	// A YouTube container runs to hundreds of kilobytes; a log is not an archive.
	it('trims markup that is too long to carry, and says by how much', () => {
		const wide = document.createElement('div');
		wide.textContent = 'x'.repeat(9000);
		document.body.append(wide);

		postMarkup('Huge', wide);

		const sent = sentMessage();
		expect(sent.message.length).toBeLessThan(4200);
		expect(sent.message).toMatch(/\+\d+ chars/);
	});

	it('says so plainly when there is nothing to show', () => {
		postMarkup('The menu', null);

		expect(sentMessage().message).toContain('nothing on the page');
	});
});
