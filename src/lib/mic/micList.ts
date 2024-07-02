import { signal } from '@preact/signals-core';

export const micList = signal<MediaDeviceInfo[]>([]);
export const hasMicPermission = signal<boolean | undefined>(undefined);


export async function updateMicrophoneList() {
	// Check if we are perhaps missing microphone permissions
	try {
		const micPerms = await navigator.permissions.query({ name: 'microphone' as PermissionName });
		if (micPerms.state === 'denied') {
			hasMicPermission.value = false;
			console.log('Microphone permission denied');
		}
	} catch (error) {
		// Unsupported browser (smh firefox)
		console.log("Unsupported browser, can't check microphone permissions");
		await navigator.mediaDevices.getUserMedia({ audio: true });
	}

	const devices = await navigator.mediaDevices.enumerateDevices();
	const inputDevices = devices.filter((device) => device.kind === 'audioinput');
	micList.value = inputDevices;
}

updateMicrophoneList();
navigator.mediaDevices.addEventListener('devicechange', updateMicrophoneList);

export default micList;
