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
import { cp, mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { watch } from 'node:fs';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = 'dist/extension';
const CHROME = path.join(OUT, 'chrome');
const FIREFOX = path.join(OUT, 'firefox');

const GECKO_ID = 'cleanmyposts@thorstenalpers.com';
/**
 * 140 on desktop and 142 on Android, which is where each first understood
 * `data_collection_permissions`.
 *
 * Not a free choice: AMO rejects a submission without that key and warns about one that claims
 * to run on a Firefox predating it. `world: "MAIN"` — how the engine gets into the page at all
 * — needs 128 anyway, so this only moves a floor that was already there.
 */
const GECKO_MIN = '140.0';
const GECKO_ANDROID_MIN = '142.0';

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

async function buildAll() {
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
	//
	// `data_collection_permissions` is what AMO now rejects a submission for leaving out, and
	// `none` is the whole of what this has to say: nothing is collected, which is also what the
	// listing and PRIVACY.md say. It is the one value that may not appear beside another.
	const firefox = {
		...manifest,
		background: { scripts: ['background.js'] },
		browser_specific_settings: {
			gecko: {
				id: GECKO_ID,
				strict_min_version: GECKO_MIN,
				data_collection_permissions: { required: ['none'] }
			},
			gecko_android: { strict_min_version: GECKO_ANDROID_MIN }
		}
	};
	await writeFile(path.join(FIREFOX, 'manifest.json'), JSON.stringify(firefox, null, 2), 'utf8');

	return manifest.version;
}

/**
 * Zips the extension root, which is the shape both stores want.
 *
 * Not `Compress-Archive`: Windows PowerShell 5.1 writes `assets\popup.js` into the archive,
 * with the separator the zip format does not use, and a browser then cannot find a single file
 * under `assets/`. `tar` is bsdtar on Windows and writes them properly; elsewhere it is GNU
 * tar, which cannot write zip at all, so `zip` does it there.
 *
 * Entries are named rather than passed as `.`, which both tools would turn into a `./` prefix
 * on everything. Source maps are left out: they are half the package and belong with the
 * source AMO asks for separately, not in the build a store serves.
 */
async function zipInto(dir, out) {
	await rm(out, { force: true });
	const entries = (await readdir(dir)).filter((name) => !name.endsWith('.map'));
	const quoted = entries.map((name) => `"${name}"`).join(' ');
	// Relative, and reached by `cd` rather than by `-C`: an absolute Windows path carries a
	// colon, and bsdtar reads what is before one as a host to connect to.
	const target = path.relative(dir, out).replace(/\\/g, '/');
	// Windows' own tar by full path, because a bare `tar` finds Git's GNU one first and that
	// cannot write zip at all. `--format zip` spelled out, because `-a` reads the format off the
	// file extension and does not find one on a relative path — it wrote a tar named .zip and
	// said nothing.
	const bsdtar = `"${process.env.SystemRoot ?? 'C:\\Windows'}\\System32\\tar.exe"`;
	const tool =
		process.platform === 'win32'
			? `${bsdtar} -c --format zip -f "${target}"`
			: `zip -qr "${target}"`;
	await promisify(exec)(`cd "${dir}" && ${tool} ${quoted}`);
}

const version = await buildAll();
console.log(`  ${CHROME}\n  ${FIREFOX}\n  version ${version}`);

if (process.argv.includes('--zip')) {
	for (const [browser, dir] of [
		['chrome', CHROME],
		['firefox', FIREFOX]
	]) {
		const out = path.join(OUT, `cleanmyposts-${browser}-${version}.zip`);
		await zipInto(dir, out);
		console.log(`  ${out}`);
	}
}

if (!process.argv.includes('--watch')) process.exit(0);

/**
 * Rebuilds on a save. It cannot reload the extension itself — Chrome only re-reads an unpacked
 * build when told to on `chrome://extensions`, and there is no API an extension can call on its
 * own behalf from outside the browser.
 *
 * Debounced because one save from an editor is several filesystem events, and a rebuild takes
 * long enough that overlapping ones would interleave their writes into the same output.
 */
const WATCHED = [
	'extension/src',
	'extension/manifest.json',
	'src/lib/engine',
	'src/lib/components'
];
let timer;
let building = false;
let again = false;

async function rebuild() {
	if (building) {
		again = true;
		return;
	}
	building = true;
	try {
		await buildAll();
		console.log(`  rebuilt — reload it on chrome://extensions, then reload the platform tab`);
	} catch (error) {
		console.error(`  build failed: ${error instanceof Error ? error.message : String(error)}`);
	}
	building = false;
	if (again) {
		again = false;
		void rebuild();
	}
}

for (const target of WATCHED) {
	watch(path.resolve(ROOT, target), { recursive: true }, () => {
		clearTimeout(timer);
		timer = setTimeout(() => void rebuild(), 150);
	});
}

console.log(`\n  watching ${WATCHED.join(', ')}\n  Ctrl+C to stop`);
