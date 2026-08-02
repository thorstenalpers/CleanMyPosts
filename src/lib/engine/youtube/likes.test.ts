import { afterEach, describe, expect, it } from 'vitest';
import { youTubeLikesAction } from './likes';

describe('youTubeLikesAction.isEmpty', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('is empty when no playlist video renderer is present', () => {
		expect(youTubeLikesAction.isEmpty()).toBe(true);
	});

	it('is not empty when a playlist video renderer is present', () => {
		document.body.innerHTML = '<ytd-playlist-video-renderer></ytd-playlist-video-renderer>';
		expect(youTubeLikesAction.isEmpty()).toBe(false);
	});
});
