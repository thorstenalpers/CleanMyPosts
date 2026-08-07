import { afterEach, describe, expect, it } from 'vitest';
import { LANGUAGES, i18n, t } from './index.svelte';

afterEach(() => {
	i18n.setting = 'System';
	i18n.applyToDocument();
});

describe('i18n', () => {
	it('offers every catalogue plus System', () => {
		expect(LANGUAGES.map((entry) => entry.id)).toEqual([
			'System',
			'en',
			'ar',
			'de',
			'es',
			'fr',
			'hi',
			'it',
			'pt',
			'ja',
			'ru',
			'zh'
		]);
	});

	it('translates through the chosen catalogue', () => {
		i18n.setting = 'ja';
		expect(t('nav.settings')).toBe('設定');
	});

	it('fills placeholders', () => {
		i18n.setting = 'de';
		expect(t('settings.versionBuilt', { version: '1.2.3', date: '2026-02-03' })).toBe(
			'Version 1.2.3, erstellt am 2026-02-03'
		);
	});

	it('mirrors the document for Arabic and only for Arabic', () => {
		i18n.setting = 'ar';
		i18n.applyToDocument();
		expect(i18n.isRtl).toBe(true);
		expect(document.documentElement.dir).toBe('rtl');
		expect(document.documentElement.lang).toBe('ar');

		i18n.setting = 'he' as never;
		expect(i18n.isRtl).toBe(false);

		i18n.setting = 'fr';
		i18n.applyToDocument();
		expect(document.documentElement.dir).toBe('ltr');
	});

	it('falls back to English for a system language nothing is translated into', () => {
		i18n.setting = 'System';
		expect(t('nav.settings')).toBe(
			navigator.language.startsWith('de') ? 'Einstellungen' : 'Settings'
		);
	});
});
