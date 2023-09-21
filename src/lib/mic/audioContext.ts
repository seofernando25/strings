import { browser } from '$app/environment';
import { type Writable, writable } from 'svelte/store';

export const audioContextStarted: Writable<boolean> = writable(false, (set) => {
	if (!browser) {
		return;
	}

	const initialStateSub = audioContextStarted.subscribe(async (started) => {
		if (!started) {
			return;
		}
		initialStateSub();
		const tone = await import('tone');
		console.log(`%cAudioContext: ${tone.getContext().state}`, 'font-size: 20px');

		const interval = setInterval(() => {
			if (tone.getContext().state === 'running') {
				set(true);
				clearInterval(interval);
			} else {
				console.log(`%cAudioContext: ${tone.getContext().state}`, 'font-size: 20px');
				set(false);
			}
		}, 16);

		return;
	});
});
