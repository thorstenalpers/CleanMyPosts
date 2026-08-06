import type { ThemePreset } from '$lib/bridge/contract';

export const THEME_PRESETS: { id: ThemePreset; label: string }[] = [
	{ id: 'default', label: 'Default' },
	{ id: 'caffeine', label: 'Caffeine' },
	{ id: 'modern-minimal', label: 'Modern Minimal' },
	{ id: 'mono', label: 'Mono' },
	{ id: 'northern-lights', label: 'Northern Lights' },
	{ id: 'twitter', label: 'Twitter' },
	{ id: 'vercel', label: 'Vercel' }
];

/**
 * Applies a change to the theme classes on <html>.
 *
 * Every theme change must go through here. Chromium keeps the *old* colour indefinitely on
 * any element that has a `transition` covering `background-color` when that colour comes
 * from a CSS custom property and the property changes on an ancestor. Buttons here carry
 * `transition-colors`, so switching the theme without this guard leaves them painted in the
 * previous theme — permanently, not just for the transition duration.
 *
 * Suppressing transitions across the swap sidesteps it, and a theme change has no business
 * animating anyway.
 */
export function applyThemeChange(mutate: () => void): void {
	const style = document.createElement('style');
	style.textContent = '*,*::before,*::after{transition:none!important;animation:none!important}';
	document.head.appendChild(style);

	mutate();

	// Force the new values to be computed while transitions are still suppressed.
	void document.body.offsetHeight;

	// The timer is not a belt-and-braces extra. A webview that is not compositing — parked
	// off-screen, occluded, or in the background, all of which this app does on purpose —
	// never fires rAF, and the suppressor would stay in the document and kill every
	// transition in the app permanently.
	let removed = false;
	const remove = () => {
		if (removed) return;
		removed = true;
		style.remove();
	};
	requestAnimationFrame(() => requestAnimationFrame(remove));
	setTimeout(remove, 100);
}

/**
 * `default` is the neutral base in app.css, so it is the absence of a preset class.
 *
 * Re-applying the preset already on screen is skipped: every call suppresses transitions
 * for a moment, and this runs from an effect that also sees unrelated settings changes.
 */
let appliedPreset: ThemePreset | undefined;

export function applyPreset(preset: ThemePreset): void {
	if (appliedPreset === preset) return;
	appliedPreset = preset;
	applyThemeChange(() => {
		const root = document.documentElement;
		for (const entry of THEME_PRESETS) {
			root.classList.toggle(`theme-${entry.id}`, entry.id === preset && entry.id !== 'default');
		}
	});
}
