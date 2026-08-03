import type { Language } from '$lib/bridge/contract';
import { en, type MessageKey } from './en';
import { de } from './de';

export type { MessageKey };

const CATALOGUES = { en, de } as const;
type Locale = keyof typeof CATALOGUES;

export const LANGUAGES: { id: Language; label: string }[] = [
	{ id: 'System', label: 'settings.language.system' },
	{ id: 'en', label: 'English' },
	{ id: 'de', label: 'Deutsch' }
];

/**
 * The app's language.
 *
 * `System` resolves against the browser locale, which inside the chrome webview is the one
 * Windows is running in — the same thing the user would expect "System" to mean everywhere
 * else in the app.
 */
class I18n {
	setting = $state<Language>('System');

	get locale(): Locale {
		if (this.setting !== 'System') return this.setting;
		const preferred = typeof navigator === 'undefined' ? 'en' : navigator.language;
		return preferred.toLowerCase().startsWith('de') ? 'de' : 'en';
	}
}

export const i18n = new I18n();

/**
 * Reading `i18n.locale` is what makes every call site re-run when the language changes, so
 * this must stay a function call in the markup rather than something hoisted into a const.
 */
export function t(key: MessageKey, params?: Record<string, string | number>): string {
	const template = CATALOGUES[i18n.locale][key] ?? en[key];
	if (!params) return template;
	return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
		name in params ? String(params[name]) : whole
	);
}
