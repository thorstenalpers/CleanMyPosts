import type { Language } from '$lib/bridge/contract';
import { en, type MessageKey } from './en';
import { ar } from './ar';
import { de } from './de';
import { es } from './es';
import { fr } from './fr';
import { hi } from './hi';
import { it } from './it';
import { ja } from './ja';
import { pt } from './pt';
import { ru } from './ru';
import { zh } from './zh';

export type { MessageKey };

const CATALOGUES = { en, ar, de, es, fr, hi, it, ja, pt, ru, zh } as const;
type Locale = keyof typeof CATALOGUES;

/** English first, then by endonym — each language names itself, so nothing here is translated. */
export const LANGUAGES: { id: Language; label: string }[] = [
	{ id: 'System', label: 'settings.language.system' },
	{ id: 'en', label: 'English' },
	{ id: 'ar', label: 'العربية' },
	{ id: 'de', label: 'Deutsch' },
	{ id: 'es', label: 'Español' },
	{ id: 'fr', label: 'Français' },
	{ id: 'hi', label: 'हिन्दी' },
	{ id: 'it', label: 'Italiano' },
	{ id: 'pt', label: 'Português' },
	{ id: 'ja', label: '日本語' },
	{ id: 'ru', label: 'Русский' },
	{ id: 'zh', label: '中文' }
];

/** Scripts that run right to left. The whole shell mirrors for these. */
const RTL: ReadonlySet<Locale> = new Set<Locale>(['ar']);

function isLocale(value: string): value is Locale {
	return value in CATALOGUES;
}

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
		const base = preferred.split('-')[0]?.toLowerCase() ?? 'en';
		return isLocale(base) ? base : 'en';
	}

	get isRtl(): boolean {
		return RTL.has(this.locale);
	}

	/** `lang` for screen readers and hyphenation, `dir` so Arabic mirrors the whole shell. */
	applyToDocument(): void {
		if (typeof document === 'undefined') return;
		document.documentElement.lang = this.locale;
		document.documentElement.dir = this.isRtl ? 'rtl' : 'ltr';
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
