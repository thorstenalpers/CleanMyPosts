import { defineConfig } from '@playwright/test';

/**
 * E2E tests run the *built* content script (`dist/content/content.js`) in real Chromium
 * against static x.com / YouTube DOM fixtures — never the live sites, so nothing is ever
 * deleted for real. `npm run test:e2e` builds the content bundle first.
 */
export default defineConfig({
	testDir: './e2e',
	timeout: 30_000,
	fullyParallel: true,
	reporter: 'list',
	projects: [{ name: 'chromium', use: { browserName: 'chromium' } }]
});
