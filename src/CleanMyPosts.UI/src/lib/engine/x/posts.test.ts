import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { postsAction } from './posts';

function markVisible(el: HTMLElement): void {
  el.getClientRects = () => [{} as DOMRect] as unknown as DOMRectList;
}

function buildTweetFixture(): { root: HTMLElement; caret: HTMLButtonElement } {
  const root = document.createElement('div');
  root.innerHTML = `
    <div data-testid="primaryColumn">
      <section>
        <article></article>
        <button data-testid="caret">More</button>
      </section>
    </div>
    <div role="menu">
      <div role="menuitem"><span style="color: rgb(220, 20, 20)">Delete</span></div>
    </div>
    <button data-testid="confirmationSheetConfirm">Delete</button>
  `;
  document.body.append(root);

  const caret = root.querySelector<HTMLButtonElement>("button[data-testid='caret']")!;
  const confirmBtn = root.querySelector<HTMLButtonElement>("button[data-testid='confirmationSheetConfirm']")!;
  const menuItemSpan = root.querySelector<HTMLSpanElement>("[role='menuitem'] span")!;
  markVisible(confirmBtn);
  markVisible(menuItemSpan);

  // Simulate the item disappearing from the DOM once deletion is confirmed.
  confirmBtn.addEventListener('click', () => {
    root.querySelector('article')?.remove();
    caret.remove();
  });

  return { root, caret };
}

describe('postsAction.isEmpty', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('is empty when no article is present', () => {
    expect(postsAction.isEmpty()).toBe(true);
  });

  it('is not empty when an article is present', () => {
    document.body.innerHTML = '<article></article>';
    expect(postsAction.isEmpty()).toBe(false);
  });
});

describe('postsAction.run', () => {
  beforeEach(() => {
    window.chrome = { webview: { postMessage: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn() } };
  });

  afterEach(() => {
    document.body.innerHTML = '';
    window.scrollTo(0, 0);
  });

  it('deletes the visible post, reports progress, and stops once none remain', async () => {
    buildTweetFixture();
    const postMessage = window.chrome!.webview!.postMessage as ReturnType<typeof vi.fn>;

    const deletedCount = await postsAction.run({
      requestId: 'req-1',
      waitAfterDelete: 1,
      waitBetweenRetryDeleteAttempts: 1
    });

    expect(deletedCount).toBe(1);
    expect(postMessage).toHaveBeenCalledWith({ type: 'progress', requestId: 'req-1', deletedCount: 1, message: undefined });
  }, 10000);

  it('returns 0 when there is nothing to delete', async () => {
    const deletedCount = await postsAction.run({
      requestId: 'req-2',
      waitAfterDelete: 1,
      waitBetweenRetryDeleteAttempts: 1
    });

    expect(deletedCount).toBe(0);
  }, 10000);
});
