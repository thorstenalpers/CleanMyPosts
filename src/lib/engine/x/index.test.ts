import { afterEach, describe, expect, it } from 'vitest';
import { getLoginStatus, getUserName } from './index';
import { siteConfig } from '../config';

describe('X sign-in detection', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('reads the handle from the profile link', () => {
		document.body.innerHTML = '<a data-testid="AppTabBar_Profile_Link" href="/thorsten"></a>';
		expect(getUserName()).toBe('thorsten');
		expect(getLoginStatus()).toBe('logged_in');
	});

	it('falls back to the account button when the nav rail has no profile link', () => {
		document.body.innerHTML =
			'<button data-testid="SideNav_AccountSwitcher_Button"><span>Thorsten</span><span>@thorsten</span></button>';
		expect(getUserName()).toBe('thorsten');
		expect(getLoginStatus()).toBe('logged_in');
	});

	it('reports signed out only when the page offers a way to sign in', () => {
		document.body.innerHTML = '<a data-testid="loginButton">Sign in</a>';
		expect(getUserName()).toBe('');
		expect(getLoginStatus()).toBe('');
	});

	it('reports unknown on a page that shows neither, so a slow render is not a sign-out', () => {
		expect(getLoginStatus()).toBe('unknown');
	});
});

describe('selectors that must survive a translated interface', () => {
	afterEach(() => {
		document.body.innerHTML = '';
	});

	// X translates every `aria-label`. The reply caret used to be matched by the English word
	// alone, so deleting replies could not work on any other account language.
	it('finds the reply caret on a German interface', () => {
		document.body.innerHTML =
			'<article><button data-testid="caret" aria-label="Mehr"></button></article>';
		const article = document.querySelector('article');

		expect(article?.querySelector(siteConfig.x.articleCaret)).not.toBeNull();
	});

	it('still finds it where only the English label is there', () => {
		document.body.innerHTML = '<article><button aria-label="More"></button></article>';
		const article = document.querySelector('article');

		expect(article?.querySelector(siteConfig.x.articleCaret)).not.toBeNull();
	});
});
