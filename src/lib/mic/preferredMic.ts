import { computed, effect, signal } from '@preact/signals-core';
import { get } from 'svelte/store';
import micList from './micList';

export const preferredMic = signal<MediaDeviceInfo | undefined>(undefined);

// Check preferredMic from localStorage
const preferredMicFromLocalStorage = localStorage.getItem('preferredMic');

effect(() => {
	const mics = micList.value;
	if (mics.length === 0) {
		preferredMic.value =  undefined;
		return;
	}
	
	// Check if preferredMic is in mics
	const foundPreferredMic = mics.find(
		(device) => device.deviceId === preferredMicFromLocalStorage
	);
	if (foundPreferredMic !== undefined) {
		preferredMic.value == foundPreferredMic;
		return;
	}
	
	// Set to first one
	const mic = get(preferredMic);
	if (mic === undefined) {
		preferredMic.value = mics[0];
		return;
	}
	
	// Check if the preferred microphone's deviceId is still available
	const micAvailable = mics.find((device) => device.deviceId === mic.deviceId);
	if (micAvailable === undefined) {
		// If the preferred microphone is no longer available, set the preferred microphone to the first available microphone
		preferredMic.value = mics[0];
	} else {
		// If the preferred microphone is still available, do nothing
		return;
	}
});

// TODO: Local storage signal
computed(() => {
	const mic = preferredMic.value;
	if (mic === undefined) {
		localStorage.removeItem('preferredMic');
		return;
	}
	localStorage.setItem('preferredMic', mic.deviceId);
});
