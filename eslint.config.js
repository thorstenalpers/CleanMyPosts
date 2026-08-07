import js from '@eslint/js';
import { defineConfig, includeIgnoreFile } from 'eslint/config';
import prettier from 'eslint-config-prettier';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import path from 'node:path';
import ts from 'typescript-eslint';

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore');

export default defineConfig(
	// Build output, node_modules and src-tauri/target are already listed there.
	includeIgnoreFile(gitignorePath),
	{
		ignores: [
			// Vendored agent skills: owned upstream, not ours to lint.
			'.claude/skills/**',
			'.agents/skills/**',
			// Regenerated verbatim by `shadcn-svelte add`, so any fix here is undone
			// by the next update.
			'src/lib/components/ui/**'
		]
	},

	js.configs.recommended,
	ts.configs.recommendedTypeChecked,
	svelte.configs.recommended,
	prettier,
	svelte.configs.prettier,

	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node },
			parserOptions: {
				// recommendedTypeChecked needs type information for every linted file,
				// not only the Svelte ones.
				projectService: true,
				tsconfigRootDir: import.meta.dirname
			}
		},
		rules: {
			// typescript-eslint strongly recommend not using no-undef on TypeScript
			// projects: the compiler already reports undefined identifiers, and the
			// rule misfires on globals it cannot see.
			// https://typescript-eslint.io/troubleshooting/faqs/eslint/
			'no-undef': 'off'
		}
	},

	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser
			}
		}
	},

	{
		// Config files, the Playwright suite and the vitest setup sit outside the app
		// tsconfig, so there is no type information to check them against.
		files: [
			'*.config.js',
			'*.config.ts',
			'eslint.config.js',
			'vitest-setup.ts',
			'scripts/**/*.mjs',
			'e2e/**/*.ts'
		],
		extends: [ts.configs.disableTypeChecked]
	}
);
