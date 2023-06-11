import { type Writable, writable, get } from 'svelte/store';
import { audioContext } from './audioContext';
import { browser } from '$app/environment';
import { gainNode } from './micGain';

export const analyzer: Writable<AnalyserNode | undefined> = writable(undefined, (set) => {
	let analyzer: AnalyserNode | undefined = undefined;
	let micSub: () => void;

	if (browser) {
		const updateAnalyzer = async () => {
			const ctx = get(audioContext);
			if (!ctx) return;
			const mic = get(gainNode);
			if (!mic) return;

			analyzer?.disconnect();
			if (!ctx) return;
			analyzer = ctx.createAnalyser();

			mic.connect(analyzer);
			set(analyzer as unknown as undefined);
		};

		micSub = gainNode.subscribe(updateAnalyzer);
	}

	return () => {
		analyzer?.disconnect();
		micSub?.();
	};
});

export default analyzer;
