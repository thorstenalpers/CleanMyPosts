import { afterEach, describe, expect, it } from 'vitest';
import { repliesAction } from './replies';

describe('repliesAction.isEmpty', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('is empty when no article is present', () => {
    expect(repliesAction.isEmpty()).toBe(true);
  });

  it('is not empty when an article is present', () => {
    document.body.innerHTML = '<article></article>';
    expect(repliesAction.isEmpty()).toBe(false);
  });
});

describe('repliesAction.run', () => {
  it('logs and returns 0 when userName is missing', async () => {
    const deletedCount = await repliesAction.run({ requestId: 'r1', waitAfterDelete: 1, waitBetweenRetryDeleteAttempts: 1 });
    expect(deletedCount).toBe(0);
  });
});
