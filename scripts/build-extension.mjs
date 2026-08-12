/**
 * Builds the Chrome and Firefox extensions from the same delete engine the desktop app runs.
 *
 * Three separate Vite builds rather than one multi-entry build: a content script has to be a
 * single classic script with no imports in it, which rules out the shared chunks Rollup emits
 * for any output with more than one entry.
 *
 * Firefox is the Chrome output with two fields rewritten. It is not a second build, and the
 * moment it becomes one the two stores start shipping different code.
 */
import { build } from 'vite';
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = 'dist/extension';
const CHROME = path.join(OUT, 'chrome');
const FIREFOX = path.join(OUT, 'firefox');

const GECKO_ID = 'cleanmyposts@thorstenalpers.com';
const GECKO_MIN = '128.0';

const alias = { $lib: path.resolve(ROOT, 'src/lib') };

/** The content script injects its own styles into a Shadow DOM, exactly as the app's does. */
const injectedSvelte = () => [
	tailwindcss(),
	svelte({ preprocess: vitePreprocess(), compilerOptions: { css: 'injected' } })
];

function singleFile(entry, fileName, first) {
	return build({
		configFile: false,
		logLevel: 'warn',
		plugins: injectedSvelte(),
		resolve: { alias },
		build: {
			outDir: CHROME,
			emptyOutDir: first,
			sourcemap: true,
			lib: {
				entry: path.resolve(ROOT, entry),
				formats: ['iife'],
				name: fileName.replace(/\W/g, '_'),
				fileName: () => fileName
			}
		}
	});
}

await rm(OUT, { recursive: true, force: true });

// The engine and the extension half are separate scripts because they run in separate worlds:
// the page's own (so `window.__cmp` is reachable from the console) and the isolated one (the
// only place `chrome.*` exists). Neither can import the other.
await singleFile('extension/src/main-world.ts', 'main-world.js', true);
await singleFile('extension/src/content.ts', 'content.js', false);
await singleFile('extension/src/background.ts', 'background.js', false);

await build({
	configFile: false,
	logLevel: 'warn',
	root: path.resolve(ROOT, 'extension/src/popup'),
	base: './',
	plugins: [tailwindcss(), svelte({ preprocess: vitePreprocess() })],
	resolve: { alias },
	build: {
		outDir: path.resolve(ROOT, CHROME),
		emptyOutDir: false,
		rollupOptions: { input: path.resolve(ROOT, 'extension/src/popup/popup.html') }
	}
});

const manifest = JSON.parse(await readFile('extension/manifest.json', 'utf8'));
await writeFile(path.join(CHROME, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

await mkdir(path.join(CHROME, 'icons'), { recursive: true });
for (const icon of ['32x32.png', '64x64.png', '128x128.png']) {
	await cp(path.join('src-tauri/icons', icon), path.join(CHROME, 'icons', icon));
}

await cp(CHROME, FIREFOX, { recursive: true });

// Firefox implements MV3 background as an event page, not a service worker, and refuses an
// unsigned build without an explicit add-on id.
const firefox = {
	...manifest,
	background: { scripts: ['background.js'] },
	browser_specific_settings: { gecko: { id: GECKO_ID, strict_min_version: GECKO_MIN } }
};
await writeFile(path.join(FIREFOX, 'manifest.json'), JSON.stringify(firefox, null, 2), 'utf8');

console.log(`  ${CHROME}\n  ${FIREFOX}\n  version ${manifest.version}`);
