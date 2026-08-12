import { mount } from 'svelte';
import { i18n } from '$lib/i18n/index.svelte';
import './popup.css';
import Popup from './Popup.svelte';

// The popup has no settings of its own yet, so it follows the browser rather than the app.
// `i18n` defaults to `System`, which reads `navigator.language` — so does this.
document.documentElement.classList.toggle(
	'dark',
	window.matchMedia('(prefers-color-scheme: dark)').matches
);
i18n.applyToDocument();

mount(Popup, { target: document.body });
