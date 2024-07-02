import { effect, signal } from '@preact/signals-core';
import { preferredMic } from './preferredMic';
import { toneContext } from './toneContext';

export const rawMicNode = signal<MediaStreamAudioSourceNode | undefined>(undefined);
export const micSampleRate = signal<number | undefined>(undefined);

effect(() => {
	// Clean up old microphone node
	if (rawMicNode.value !== undefined) {
		rawMicNode.value?.disconnect();
	}	

	// Check if we have everything we need
	const mic = preferredMic.value;
	const audioCtx = toneContext.value;
	if (mic === undefined || audioCtx === undefined) {
		rawMicNode.value = undefined;
		micSampleRate.value = undefined;
		return;
	}
	

	navigator.mediaDevices.getUserMedia({
		audio: {
			deviceId: mic.deviceId,
			echoCancellation: false,
			noiseSuppression: false,
			autoGainControl: false
		},
		video: false
	}).then((stream) => {
		rawMicNode.value  = audioCtx.createMediaStreamSource(stream);
		const sampleRate = rawMicNode.value.mediaStream.getAudioTracks()[0].getSettings().sampleRate;
		micSampleRate.value = sampleRate;
	});
});


export default rawMicNode;
