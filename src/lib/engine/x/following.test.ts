import { afterEach, describe, expect, it } from 'vitest';
import { followingAction } from './following';

describe('followingAction.isEmpty', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('is empty when the X emptyState marker is present', () => {
		document.body.innerHTML = '<div data-testid="emptyState"></div>';
		expect(followingAction.isEmpty()).toBe(true);
	});

	it('is not empty otherwise', () => {
		expect(followingAction.isEmpty()).toBe(false);
	});
});
