import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rule = '#'.repeat(100);

// `shell` because npm is a .cmd on Windows, which Node refuses to spawn otherwise. Every
// argument here is a literal, so the usual escaping hazard does not apply.
function run(command, args, cwd) {
	return execFileSync(command, args, {
		cwd,
		encoding: 'utf8',
		maxBuffer: 64 * 1024 * 1024,
		shell: true
	});
}

function crates() {
	// Only what actually ships: the Windows target, no build- or dev-dependencies.
	const json = run(
		'cargo',
		[
			'license',
			'--json',
			'--avoid-dev-deps',
			'--avoid-build-deps',
			'--filter-platform',
			'x86_64-pc-windows-msvc'
		],
		join(root, 'src-tauri')
	);

	return JSON.parse(json)
		.filter((crate) => crate.name !== 'cleanmyposts')
		.map((crate) => ({
			name: crate.name,
			version: crate.version,
			url: crate.repository ?? '',
			license: crate.license ?? 'UNKNOWN',
			description: crate.description ?? ''
		}));
}

// Every package in the tree, not just `dependencies`: adapter-static bundles at build
// time, so this project keeps everything under devDependencies and the split carries no
// information about what ships.
function packages() {
	const tree = JSON.parse(run('npm', ['ls', '--all', '--long', '--json'], root));
	const found = new Map();

	(function walk(node) {
		for (const [name, dep] of Object.entries(node.dependencies ?? {})) {
			if (!dep.version) continue;
			const key = `${name}@${dep.version}`;
			if (!found.has(key)) {
				found.set(key, {
					name,
					version: dep.version,
					license: dep.license ?? 'UNKNOWN',
					...manifest(dep.path)
				});
			}
			walk(dep);
		}
	})(tree);

	return [...found.values()];
}

// `npm ls --long` reports the license but neither the repository nor the description.
function manifest(path) {
	if (!path) return { url: '', description: '' };
	try {
		const pkg = JSON.parse(readFileSync(join(path, 'package.json'), 'utf8'));
		const repository = typeof pkg.repository === 'string' ? pkg.repository : pkg.repository?.url;
		return {
			url: (repository ?? pkg.homepage ?? '').replace(/^git\+/, '').replace(/\.git$/, ''),
			description: pkg.description ?? ''
		};
	} catch {
		return { url: '', description: '' };
	}
}

function section(title, entries) {
	const body = entries
		.sort((a, b) => a.name.localeCompare(b.name))
		.map((entry) =>
			[
				rule,
				`Package:${entry.name}`,
				`Version:${entry.version}`,
				`project URL:${entry.url}`,
				`Description:${entry.description}`,
				`license Type:${entry.license}`,
				''
			].join('\n')
		)
		.join('\n');

	return `${rule}\n${title} (${entries.length})\n${body}\n`;
}

const output = [
	section('Rust crates', crates()),
	section('npm packages (build and runtime)', packages())
].join('\n');

writeFileSync(join(root, 'THIRD_PARTY_LICENSES.txt'), output, 'utf8');
console.log('THIRD_PARTY_LICENSES.txt written.');
