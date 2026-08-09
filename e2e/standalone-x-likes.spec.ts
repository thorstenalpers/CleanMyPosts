import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * The download for people who cannot run the app.
 *
 * Versions up to 2.x shipped these as hand-written JavaScript, which drifted from the app the
 * moment a selector was fixed in one and not the other. They are generated from the same
 * engine now — and this is what proves the generated file is a thing that runs, rather than a
 * bundle that merely built.
 *
 * Everything about it is different from the injected script: no host bridge, no `window.__cmp`,
 * no call from Rust. It starts on paste and reports to the console, and both of those are what
 * is checked here.
 */
const dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtureUrl = pathToFileURL(path.resolve(dirname, 'fixtures/x-likes.html')).href;
const script = path.resolve(dirname, '../dist/scripts/delete-all-x-likes.js');

test('the standalone likes script runs on paste and empties the page', async ({ page }) => {
	const logged: string[] = [];
	page.on('console', (message) => logged.push(message.text()));

	await page.goto(fixtureUrl);
	expect(await page.locator('[data-testid="unlike"]').count()).toBe(3);

	// No bridge is installed first, deliberately: this is the console, and the engine has to
	// notice there is no host and talk to it instead.
	await page.addScriptTag({ path: script });

	await expect
		.poll(() => page.locator('[data-testid="unlike"]').count(), { timeout: 20_000 })
		.toBe(0);
	await expect
		.poll(() => logged.filter((line) => line.includes('Finished')).length, { timeout: 20_000 })
		.toBe(1);

	expect(logged.some((line) => line.includes('3 removed'))).toBe(true);
	// It says where it belongs before it does anything: run on the wrong page, it finds nothing.
	expect(logged.some((line) => line.includes('Run this on your likes'))).toBe(true);
});
