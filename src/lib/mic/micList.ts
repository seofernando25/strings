import { browser } from '$app/environment';
import { type Writable, writable } from 'svelte/store';

export const micList: Writable<MediaDeviceInfo[]> = writable([]);
export const hasMicPermission: Writable<boolean> = writable(false);

export async function updateMicrophoneList() {
	// Check if we are perhaps missing microphone permissions
	try {
		const micPerms = await navigator.permissions.query({ name: 'microphone' as PermissionName });
		if (micPerms.state === 'denied') {
			console.log('Microphone permission denied');
		}
	} catch (error) {
		// Unsupported browser (smh firefox)
		console.log("Unsupported browser, can't check microphone permissions");
		await navigator.mediaDevices.getUserMedia({ audio: true });
	}

	const devices = await navigator.mediaDevices.enumerateDevices();
	const inputDevices = devices.filter((device) => device.kind === 'audioinput');
	micList.set(inputDevices);
}

if (browser) {
	updateMicrophoneList();
	navigator.mediaDevices.removeEventListener('devicechange', updateMicrophoneList);
	navigator.mediaDevices.addEventListener('devicechange', updateMicrophoneList);
}

export default micList;
