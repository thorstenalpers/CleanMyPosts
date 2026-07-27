import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { likesAction } from './likes';

function markVisible(el: HTMLElement): void {
  el.getClientRects = () => [{} as DOMRect] as unknown as DOMRectList;
  Object.defineProperty(el, 'offsetParent', { value: document.body, configurable: true });
}

describe('likesAction.isEmpty', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('is empty when the X emptyState marker is present', () => {
    document.body.innerHTML = '<div data-testid="emptyState"></div>';
    expect(likesAction.isEmpty()).toBe(true);
  });

  it('is not empty otherwise', () => {
    expect(likesAction.isEmpty()).toBe(false);
  });
});

describe('likesAction.run', () => {
  beforeEach(() => {
    window.chrome = { webview: { postMessage: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn() } };
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('unlikes each visible post and stops once the button disappears', async () => {
    const btn = document.createElement('button');
    btn.setAttribute('data-testid', 'unlike');
    markVisible(btn);
    btn.addEventListener('click', () => btn.remove());
    document.body.append(btn);

    const deletedCount = await likesAction.run({ requestId: 'r1', waitAfterDelete: 1, waitBetweenRetryDeleteAttempts: 1 });

    expect(deletedCount).toBe(1);
    expect(document.querySelector('[data-testid="unlike"]')).toBeNull();
  }, 10000);

  it('returns 0 when no unlike button is ever found', async () => {
    const deletedCount = await likesAction.run({ requestId: 'r2', waitAfterDelete: 1, waitBetweenRetryDeleteAttempts: 1 });
    expect(deletedCount).toBe(0);
  }, 10000);
});
