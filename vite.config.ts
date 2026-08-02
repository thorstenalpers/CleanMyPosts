import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';

// SvelteKit owns the output layout ($lib, the build directory, asset names); the content
// script is built separately by vite.content.config.ts and must never see this plugin.
export default defineConfig({
  plugins: [tailwindcss(), sveltekit()]
});
