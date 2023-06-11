import { type Writable, writable, get } from 'svelte/store';
import { preferredMic } from './preferredMic';
import { audioContext } from './audioContext';
import { browser } from '$app/environment';

export const rawMicNode: Writable<MediaStreamAudioSourceNode | undefined> = writable();

async function updateMicrophoneNode() {
	// Clean up old microphone node
	if (get(rawMicNode) !== undefined) {
		get(rawMicNode)?.disconnect();
	}

	// Check if we have everything we need
	const mic = get(preferredMic);
	const audioCtx = get(audioContext);
	if (mic === undefined || audioCtx === undefined) {
		rawMicNode.set(undefined);
		return;
	}

	const stream = await navigator.mediaDevices.getUserMedia({
		audio: {
			deviceId: mic.deviceId,
			echoCancellation: false,
			noiseSuppression: false,
			autoGainControl: false
		},
		video: false
	});
	rawMicNode.set(audioCtx.createMediaStreamSource(stream));
}

if (browser) {
	preferredMic.subscribe(updateMicrophoneNode);
	audioContext.subscribe(updateMicrophoneNode);
}

export default rawMicNode;
