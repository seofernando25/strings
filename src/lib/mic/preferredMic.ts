import { type Writable, writable, get } from 'svelte/store';
import micList from './micList';
import { browser } from '$app/environment';

export const preferredMic: Writable<MediaDeviceInfo | undefined> = writable();

if (browser) {
	micList.subscribe((micList) => {
		if (micList.length === 0) {
			preferredMic.set(undefined);
			return;
		}

		// Initial Setup
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
}
