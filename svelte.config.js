import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
export default {
	preprocess: vitePreprocess(),
	kit: {
		// No fallback: every route is prerendered to its own HTML, so the file the webview
		// opens already contains the shell instead of an empty div waiting for the router.
		adapter: adapter()
	}
};
