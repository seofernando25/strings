import type { Config } from 'tailwindcss';

const config = {
	darkMode: 'class',
	content: [
		'./src/**/*.{html,js,svelte,ts}',
	],
} satisfies Config;

export default config;