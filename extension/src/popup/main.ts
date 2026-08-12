import { mount } from 'svelte';
import './popup.css';
import Popup from './Popup.svelte';

// The popup has no settings of its own yet, so it follows the browser rather than the app.
document.documentElement.classList.toggle(
	'dark',
	window.matchMedia('(prefers-color-scheme: dark)').matches
);

mount(Popup, { target: document.body });
