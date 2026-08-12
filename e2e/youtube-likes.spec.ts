import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtureUrl = pathToFileURL(path.resolve(dirname, 'fixtures/youtube-likes.html')).href;
const contentScript = path.resolve(dirname, '../dist/content/content.js');

interface ContentMessage {
	type: string;
	deletedCount?: number;
}

declare global {
	interface Window {
		__msgs: ContentMessage[];
	}
}

/**
 * The other half of `youtube-comments.spec.ts`: same action, same page, no confirmation sheet.
 *
 * Both YouTube lists are the one engine on My Activity now, and what still differs between them
 * is whether a sheet opens. This one covers the list where none does — where an engine that
 * waits for one regardless spends four seconds on every item it deletes.
 */
test('deleteLikes removes every row and reports progress in a real browser', async ({ page }) => {
	// Capture what the injected engine posts back, standing in for the WPF host.
	await page.addInitScript(() => {
		window.__msgs = [];
		window.chrome = {
			webview: {
				postMessage: (m: unknown) => window.__msgs.push(m as ContentMessage),
				addEventListener: () => {},
				removeEventListener: () => {}
			}
		} as unknown as typeof window.chrome;
	});

	await page.goto(fixtureUrl);
	await page.addScriptTag({ path: contentScript });
	await expect.poll(() => page.evaluate(() => typeof window.__cmp)).toBe('object');

	await page.evaluate(() =>
		window.__cmp!.run(
			'youtube',
			'deleteLikes',
			JSON.stringify({ requestId: 'r1', waitAfterDelete: 1, waitBetweenRetryDeleteAttempts: 1 })
		)
	);

	await page.waitForFunction(() => window.__msgs.some((m) => m.type === 'done'), null, {
		timeout: 20_000
	});

	const msgs = await page.evaluate(() => window.__msgs);
	expect(msgs.find((m) => m.type === 'done')?.deletedCount).toBe(2);
	expect(msgs.filter((m) => m.type === 'progress').map((m) => m.deletedCount)).toEqual([1, 2]);

	const remaining = await page.evaluate(
		() => document.querySelectorAll('div[role="listitem"]').length
	);
	expect(remaining).toBe(0);
});
