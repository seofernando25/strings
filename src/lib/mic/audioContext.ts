import { signal } from '@preact/signals-core';
import { toneContext } from './toneContext';

export const audioContextStarted = signal(false);


setInterval(() => {
	if (toneContext.value.state === 'running') {
		audioContextStarted.value = true;
	} else {
		audioContextStarted.value = false
	}
}, 16);