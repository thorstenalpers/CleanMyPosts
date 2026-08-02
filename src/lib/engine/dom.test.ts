import { describe, expect, it, vi, beforeEach } from 'vitest';
import { delay, isVisible, waitFor, waitForByScrolling, postLog, postProgress, postDone } from './dom';

describe('delay', () => {
  it('resolves after the given time', async () => {
    vi.useFakeTimers();
    const spy = vi.fn();
    delay(1000).then(spy);

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
    window.chrome = { webview: { postMessage, addEventListener: vi.fn(), removeEventListener: vi.fn() } };
  });

  it('postLog posts a log message', () => {
    postLog('warning', 'careful');
    expect(postMessage).toHaveBeenCalledWith({ type: 'log', level: 'warning', message: 'careful' });
  });

  it('postProgress posts a progress message', () => {
    postProgress('req-1', 4, 'four so far');
    expect(postMessage).toHaveBeenCalledWith({ type: 'progress', requestId: 'req-1', deletedCount: 4, message: 'four so far' });
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
