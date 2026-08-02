import { defineConfig } from 'vite';
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

/**
 * The content script is injected as a single raw JS string via
 * CoreWebView2.AddScriptToExecuteOnDocumentCreatedAsync, so it must build
 * to one dependency-free IIFE file — including its CSS, which it imports as
 * an inline string (`?inline`) and injects into its own Shadow DOM rather
 * than relying on an external stylesheet.
 */
export default defineConfig({
  plugins: [
    tailwindcss(),
    // css: 'injected' — component-scoped styles (e.g. svelte-sonner's own <style> block) are
    // normally extracted to a separate .css file, which this single-file build can't load.
    svelte({ preprocess: vitePreprocess(), compilerOptions: { css: 'injected' } })
  ],
  resolve: {
    alias: {
      $lib: path.resolve(__dirname, 'src/lib')
    }
  },
  build: {
    outDir: 'dist/content',
    emptyOutDir: true,
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, 'src/content-entry.ts'),
      name: '__cmpContentScript',
      formats: ['iife'],
      fileName: () => 'content.js'
    }
  }
});
