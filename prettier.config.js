/** @type {import("prettier").Config} */
const config = {
	useTabs: true,
	singleQuote: true,
	trailingComma: 'none',
	printWidth: 100,
	plugins: ['prettier-plugin-svelte', 'prettier-plugin-tailwindcss'],
	overrides: [{ files: '*.svelte', options: { parser: 'svelte' } }],
	// Lets prettier-plugin-tailwindcss resolve this project's own theme tokens
	// when it sorts class lists.
	tailwindStylesheet: './src/app.css'
};

export default config;
