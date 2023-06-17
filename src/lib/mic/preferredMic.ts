import { type Writable, writable, get } from 'svelte/store';
import micList from './micList';
import { browser } from '$app/environment';

export const preferredMic: Writable<MediaDeviceInfo | undefined> = writable();

if (browser) {
	// Check preferredMic from localStorage
	const preferredMicFromLocalStorage = localStorage.getItem('preferredMic');

	micList.subscribe((micList) => {
		if (micList.length === 0) {
			preferredMic.set(undefined);
			return;
		}

		// Check if preferredMic is in micList
		const foundPreferredMic = micList.find(
			(device) => device.deviceId === preferredMicFromLocalStorage
		);
		if (foundPreferredMic !== undefined) {
			preferredMic.set(foundPreferredMic);
			return;
		}

		// Set to first one
		const mic = get(preferredMic);
		if (mic === undefined) {
			preferredMic.set(micList[0]);
			return;
		}

		// Check if the preferred microphone's deviceId is still available
		const micAvailable = micList.find((device) => device.deviceId === mic.deviceId);
		if (micAvailable === undefined) {
			// If the preferred microphone is no longer available, set the preferred microphone to the first available microphone
			preferredMic.set(micList[0]);
		} else {
			// If the preferred microphone is still available, do nothing
			return;
		}
	});

	preferredMic.subscribe((mic) => {
		if (mic === undefined) {
			localStorage.removeItem('preferredMic');
			return;
		}
		localStorage.setItem('preferredMic', mic.deviceId);
	});
}
