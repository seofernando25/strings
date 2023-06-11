import { browser } from '$app/environment';
import { type Writable, writable } from 'svelte/store';

const SAMPLE_RATE = 16000;

export const audioContext: Writable<AudioContext | undefined> = writable(undefined, (set) => {
	if (browser) {
		set(
			new AudioContext({
				sampleRate: SAMPLE_RATE
			}) as unknown as undefined
		);
	}
});
