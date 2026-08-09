/**
 * Builds one standalone script per delete action, for people who cannot run the app.
 *
 * Versions up to 2.x shipped these as hand-written JavaScript beside the app. That was a
 * second implementation of the same clicking, and it drifted: a selector fixed in the app
 * stayed broken in the file somebody had downloaded. These are generated from
 * `src/lib/engine/` instead, so there is one source and the two cannot disagree.
 *
 * Each output is an IIFE that starts on paste, reports through `console.log` — the engine
 * falls back to it wherever the app's bridge is absent — and is left unminified, because the
 * whole point is that a person can read what they are about to run in their own account.
 */
import { build } from 'vite';
import { mkdir, rm, writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const OUT = 'dist/scripts';
const TEMP = 'dist/.standalone-entries';

/**
 * The same actions the app offers.
 *
 * Named product-platform-action: a release asset lands in a downloads folder next to
 * everything else somebody grabbed that week, so it has to say whose it is, and a file that
 * deletes has to say so in its own name — not only in the header nobody reads twice.
 */
const ACTIONS = [
	{
		file: 'cleanmyposts-x-delete-posts',
		from: 'x/posts',
		name: 'postsAction',
		page: 'your profile’s posts'
	},
	{ file: 'cleanmyposts-x-delete-replies', from: 'x/replies', name: 'repliesAction', page: 'your replies' },
	{ file: 'cleanmyposts-x-delete-reposts', from: 'x/reposts', name: 'repostsAction', page: 'your profile' },
	{ file: 'cleanmyposts-x-delete-likes', from: 'x/likes', name: 'likesAction', page: 'your likes' },
	{
		file: 'cleanmyposts-x-delete-following',
		from: 'x/following',
		name: 'followingAction',
		page: 'who you follow'
	},
	{
		file: 'cleanmyposts-youtube-delete-comments',
		from: 'youtube/comments',
		name: 'commentsAction',
		page: 'My Activity → YouTube comments'
	},
	{
		file: 'cleanmyposts-youtube-delete-likes',
		from: 'youtube/likes',
		name: 'youTubeLikesAction',
		page: 'your Liked videos playlist'
	}
];

/**
 * The wrapper around one action.
 *
 * The waits are the same ones the app defaults to, and they are the only brake against the
 * platform treating the session as automation — named at the top so somebody raising them
 * does not have to read the rest.
 */
function entrySource({ from, name, page }) {
	// The one action's own module, not the platform's index: importing the index pulls every
	// other action in with it, and a file nobody can read is a file nobody will check.
	return `import { ${name} } from '../../src/lib/engine/${from}';

(async () => {
	// Raise these if the platform starts refusing. Lowering them is what gets a session flagged.
	const waitAfterDelete = 500;
	const waitBetweenRetryDeleteAttempts = 500;

	const action = ${name};
	console.log('[CleanMyPosts] Run this on ${page}. Nothing else on the page is touched.');

	try {
		const deleted = await action.run({
			requestId: 'standalone',
			waitAfterDelete,
			waitBetweenRetryDeleteAttempts
		});
		console.log(\`[CleanMyPosts] Finished — \${deleted} removed.\`);
	} catch (error) {
		console.error('[CleanMyPosts] Stopped:', error);
	}
})();
`;
}

function header(name, page) {
	return `/*
 * CleanMyPosts — ${name}
 *
 * Generated from the app's own delete engine; do not edit by hand.
 * https://github.com/thorstenalpers/CleanMyPosts
 *
 * Open ${page}, sign in, press F12, paste this into the Console and press Enter.
 * It deletes for as long as it finds anything, and deletion cannot be undone.
 * Close the tab to stop it.
 */
`;
}

await rm(OUT, { recursive: true, force: true });
await rm(TEMP, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });
await mkdir(TEMP, { recursive: true });

for (const entry of ACTIONS) {
	const temp = join(TEMP, `${entry.file}.js`);
	await writeFile(temp, entrySource(entry), 'utf8');

	await build({
		configFile: false,
		logLevel: 'warn',
		build: {
			outDir: OUT,
			emptyOutDir: false,
			minify: false,
			lib: {
				entry: temp,
				formats: ['iife'],
				name: 'CleanMyPosts',
				fileName: () => `${entry.file}.js`
			}
		}
	});

	const built = join(OUT, `${entry.file}.js`);
	await writeFile(built, header(entry.file, entry.page) + (await readFile(built, 'utf8')), 'utf8');
	console.log(`  ${built}`);
}

await rm(TEMP, { recursive: true, force: true });
console.log(`${ACTIONS.length} standalone scripts in ${OUT}`);
