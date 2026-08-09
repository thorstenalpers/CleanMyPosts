import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SITE_LANGUAGES, localise, type SiteLanguage } from './fixtures/languages';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const contentScript = path.resolve(dirname, '../dist/content/content.js');
const fixture = (name: string) =>
	pathToFileURL(path.resolve(dirname, `fixtures/${name}.html`)).href;

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
 * The same page the English specs use, in another language and stripped of every hook that
 * only an English-speaking reader would have found. What is under test is whether the engine
 * still gets there — see `fixtures/languages.ts` for what that does and does not prove.
 */
async function open(page: Page, name: string, language: SiteLanguage): Promise<void> {
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

	await page.goto(fixture(name));
	await localise(page, language);
	await page.addScriptTag({ path: contentScript });
	await expect.poll(() => page.evaluate(() => typeof window.__cmp)).toBe('object');
}

async function run(page: Page, platform: string, action: string): Promise<number> {
	await page.evaluate(
		({ platform, action }) =>
			window.__cmp!.run(
				platform,
				action,
				JSON.stringify({
					requestId: 'lang',
					userName: 'testuser',
					waitAfterDelete: 1,
					waitBetweenRetryDeleteAttempts: 1
				})
			),
		{ platform, action }
	);

	await page.waitForFunction(() => window.__msgs.some((m) => m.type === 'done'), null, {
		timeout: 20_000
	});
	const msgs = await page.evaluate(() => window.__msgs);
	return msgs.find((m) => m.type === 'done')?.deletedCount ?? 0;
}

for (const language of SITE_LANGUAGES) {
	test.describe(`a site in ${language.id}`, () => {
		// X keeps its test ids in every language, so the only translated thing the run depends
		// on is the word in the post menu.
		test('deletes X posts through the translated menu entry', async ({ page }) => {
			await open(page, 'x-posts', language);
			expect(await run(page, 'x', 'deletePosts')).toBe(2);
		});

		// Both of YouTube's own hooks are gone here: the label on the overflow button is
		// translated, so the class has to carry it, and the entry itself is only findable by
		// its words.
		test('removes liked videos through the translated overflow entry', async ({ page }) => {
			await open(page, 'youtube-likes', language);
			expect(await run(page, 'youtube', 'deleteLikes')).toBe(2);
		});

		// My Activity is a Google surface: the row's ✕ is found by `jscontroller`, and the
		// confirmation sheet — with its id taken away — by the word on the button.
		test('deletes YouTube comments through the translated confirmation', async ({ page }) => {
			await open(page, 'youtube-comments', language);
			expect(await run(page, 'youtube', 'deleteComments')).toBe(2);
		});
	});
}
