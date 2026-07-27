import { defineConfig } from 'vite';
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [tailwindcss(), svelte({ preprocess: vitePreprocess() })],
  resolve: {
    alias: {
      $lib: path.resolve(__dirname, 'src/lib')
    }
  },
  build: {
    outDir: 'dist/chrome',
    emptyOutDir: true,
    rollupOptions: {
      // Stable (unhashed) filenames: this is a locally-hosted desktop app, not a
      // CDN asset needing cache-busting, and MSBuild's Content-item glob for
      // `dist/chrome/**` is evaluated once at project load — a hash that changes
      // between builds makes that stale item list reference files that no longer
      // exist by the time `dotnet build` tries to copy them.
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]'
      }
    }
  }
});
