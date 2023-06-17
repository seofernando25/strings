import { type Writable, writable, get } from 'svelte/store';

const SAMPLE_RATE = 16000;

export const audioContext: Writable<AudioContext> = writable(
	new AudioContext({
		sampleRate: SAMPLE_RATE
	}),
	() => {
		// Try to resume audio if suspended.
		const interval = setInterval(() => {
			if (get(audioContext).state === 'suspended') {
				get(audioContext).resume();
			}
		}, 5);

		return () => {
			clearInterval(interval);
		};
	}
);
