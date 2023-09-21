import { type Writable, writable, get } from 'svelte/store';
import { preferredMic } from './preferredMic';
import { browser } from '$app/environment';
import * as Tone from 'tone';
import { audioContextStarted } from './audioContext';

export const rawMicNode: Writable<MediaStreamAudioSourceNode | undefined> = writable();

async function updateMicrophoneNode() {
	// Clean up old microphone node
	if (get(rawMicNode) !== undefined) {
		get(rawMicNode)?.disconnect();
	}

	// Check if we have everything we need
	const mic = get(preferredMic);
	const audioCtx = Tone.getContext();
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
	audioContextStarted.subscribe(updateMicrophoneNode);
}

export default rawMicNode;
