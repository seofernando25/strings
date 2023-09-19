import { type Writable, writable } from 'svelte/store';
import * as Tone from 'tone';

export const audioContextStarted: Writable<boolean> = writable(false, (set) => {
	const interval = setInterval(() => {
		if (Tone.getContext().state === 'running') {
			console.log('%cAudioContext Started', 'font-size: 20px');
			set(true);
			clearInterval(interval);
		} else {
			set(false);
		}
	}, 16);
});
