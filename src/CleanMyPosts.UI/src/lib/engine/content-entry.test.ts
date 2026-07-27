import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import './content-entry';

describe('window.__cmp', () => {
  let postMessage: ReturnType<typeof vi.fn<(message: unknown) => void>>;

  beforeEach(() => {
    postMessage = vi.fn();
    window.chrome = { webview: { postMessage, addEventListener: vi.fn(), removeEventListener: vi.fn() } };
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
    window.__cmp!.run('x', 'deleteEverything' as never, JSON.stringify({ requestId: 'r1', waitAfterDelete: 1, waitBetweenRetryDeleteAttempts: 1 }));

    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'error', requestId: 'r1' })
    );
  });

  it('run posts done with deletedCount 0 when there is nothing to delete', async () => {
    window.__cmp!.run('x', 'deletePosts', JSON.stringify({ requestId: 'r2', waitAfterDelete: 1, waitBetweenRetryDeleteAttempts: 1 }));

    await vi.waitFor(
      () => expect(postMessage).toHaveBeenCalledWith({ type: 'done', requestId: 'r2', deletedCount: 0 }),
      { timeout: 8000 }
    );
  }, 10000);

  it('getUserName and getLoginStatus are exposed', () => {
    expect(typeof window.__cmp!.getUserName()).toBe('string');
    expect(typeof window.__cmp!.getLoginStatus()).toBe('string');
  });
});
