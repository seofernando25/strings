import { join } from 'path';
import type { Config } from 'tailwindcss';
import { stringsTheme } from './src/lib/theme';
// 1. Import the Skeleton plugin
import { skeleton } from '@skeletonlabs/tw-plugin';

const config = {
	// 2. Opt for dark mode to be handled via the class method
	darkMode: 'class',
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		join(require.resolve(
			'@skeletonlabs/skeleton'),
			'../**/*.{html,js,svelte,ts}'
		)
	],
	plugins: [
		skeleton({
			themes: {
				custom: [stringsTheme]
			}
		}),
	]
} satisfies Config;

export default config;