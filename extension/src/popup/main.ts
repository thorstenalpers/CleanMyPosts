import { mount } from 'svelte';
import { i18n } from '$lib/i18n/index.svelte';
import './popup.css';
import Popup from './Popup.svelte';

// The browser's preferences, so the first paint is not white on a dark setup. The stored
// choice arrives a tick later, from storage, and `Popup.svelte` applies it over this.
document.documentElement.classList.toggle(
	'dark',
	window.matchMedia('(prefers-color-scheme: dark)').matches
);
i18n.applyToDocument();

mount(Popup, { target: document.body });
