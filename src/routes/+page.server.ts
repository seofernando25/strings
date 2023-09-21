import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (e) => {
	console.log('Loading +page');
	e.setHeaders({
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET',
		'Cross-Origin-Opener-Policy': 'same-origin',
		'Cross-Origin-Embedder-Policy': 'require-corp'
	});
};
