import { afterEach, describe, expect, it } from 'vitest';
import { getLoginStatus } from './index';

describe('YouTube sign-in detection', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('reads the avatar on youtube.com', () => {
		document.body.innerHTML =
			'<button id="avatar-btn"><img src="https://example.test/a.png" /></button>';
		expect(getLoginStatus()).toBe('logged_in');
	});

	it('counts My Activity rows as an account', () => {
		document.body.innerHTML = '<div data-activity-collection-name="youtube_comments"></div>';
		expect(getLoginStatus()).toBe('logged_in');
	});

	// The regression: every Google page links to accounts.google.com from its account menu,
	// so a bare link there used to read My Activity as signed out and disable the panel.
	it('does not call an account link on My Activity a sign-out', () => {
		document.body.innerHTML =
			'<div role="listitem">a comment</div><a href="https://accounts.google.com/SignOutOptions">Account</a>';
		expect(getLoginStatus()).toBe('logged_in');
	});

	it('reports signed out on YouTube’s own sign-in button', () => {
		document.body.innerHTML =
			'<ytd-button-renderer><a href="https://accounts.google.com/ServiceLogin">Sign in</a></ytd-button-renderer>';
		expect(getLoginStatus()).toBe('');
	});

	it('reports unknown when the page shows neither', () => {
		expect(getLoginStatus()).toBe('unknown');
	});
});
