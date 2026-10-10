import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-static';
import tailwindcss from '@tailwindcss/vite';

// SvelteKit owns the output layout ($lib, the build directory, asset names); the content
// script is built separately by vite.content.config.ts and must never see this plugin.
export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			// No fallback: every route is prerendered to its own HTML, so the file the webview
			// opens already contains the shell instead of an empty div waiting for the router.
			adapter: adapter(),
			alias: { $lib: 'src/lib' }
		})
	],
	server: {
		// Pinned because tauri.conf.json waits for exactly this URL: on a taken port Vite
		// would silently pick the next one and `npm run start` would hang forever.
		port: 5175,
		strictPort: true,
		// Cargo rewrites the exe while the dev server runs, and the watcher dies on it
		// with EBUSY. Nothing under src-tauri is served by Vite anyway.
		watch: { ignored: ['**/src-tauri/**'] }
	}
});
