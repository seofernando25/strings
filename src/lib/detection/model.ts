import * as tf from '@tensorflow/tfjs';
import { gainNode } from '../mic';
import { type Writable, writable, get } from 'svelte/store';
import * as Tone from 'tone';
const NUM_INPUT_SAMPLES = 1024;
import workletUrl from './worklet.audioworklet.ts?url';

const CONF_THRESHOLD = 0.75;
const MODEL_URL = 'https://tfhub.dev/google/tfjs-model/spice/2/default/1';
let model: tf.GraphModel;

console.log('worklet', workletUrl);
export const pitches: Writable<number[]> = writable([], () => {
	// const size = Int32Array.BYTES_PER_ELEMENT * NUM_INPUT_SAMPLES;
	// const sab = new SharedArrayBuffer(size);
	// const sharedArray = new Int32Array(sab);

	tf.loadGraphModel(MODEL_URL, { fromTFHub: true })
		.then((m) => {
			model = m;
		})
		.catch((e) => {
			console.log(e);
		});

	let processor: ScriptProcessorNode | undefined = undefined;
	const run = async () => {
		const audioCtx = Tone.getContext();
		const source = get(gainNode);
		if (!audioCtx) return;
		if (!source) return;

		if (!processor) {
			audioCtx?.addAudioWorkletModule(workletUrl, 'pitch-detection-processor');
			processor = audioCtx?.rawContext.createScriptProcessor(NUM_INPUT_SAMPLES, 1, 1);
		} else {
			processor.disconnect();
			processor.removeEventListener('audioprocess', audioProc);
		}

		// Converts audio to mono.
		processor.channelInterpretation = 'speakers';
		processor.channelCount = 1;
		source?.connect(processor);
		processor.connect(audioCtx.rawContext.destination);
		processor.addEventListener('audioprocess', audioProc);
	};

	const sub = gainNode.subscribe(run);

	return () => {
		sub();
	};
});

export async function startDemo() {
	const audioCtx = Tone.getContext();
	if (!audioCtx) {
		console.log('context is undefined');
		return;
	}
	const source = get(gainNode);
	const processor = audioCtx?.rawContext.createScriptProcessor(NUM_INPUT_SAMPLES, 1, 1);
	if (!processor) {
		console.log('processor is undefined');
		return;
	}
	// Converts audio to mono.
	processor.channelInterpretation = 'speakers';
	processor.channelCount = 1;
	// Runs processor on audio source.
	source?.connect(processor);
	processor.connect(audioCtx.rawContext.destination);
	processor.addEventListener('audioprocess', audioProc);
}

function getPitchHz(modelPitch: number) {
	const PT_OFFSET = 25.58;
	const PT_SLOPE = 63.07;
	const fmin = 10.0;
	const bins_per_octave = 12.0;
	const cqt_bin = modelPitch * PT_SLOPE + PT_OFFSET;
	return fmin * Math.pow(2.0, cqt_bin / bins_per_octave);
}

function audioProc(e: AudioProcessingEvent) {
	const inputData = e.inputBuffer.getChannelData(0);
	const input = tf.reshape(tf.tensor(inputData), [NUM_INPUT_SAMPLES]);
	const output = model?.execute({ input_audio_samples: input }) as tf.Tensor<tf.Rank>[];
	if (output === undefined) {
		// console.log('output is undefined');
		return;
	}

	const uncertainties = output[0].dataSync();
	const pitchesFetched = output[1].dataSync() as unknown as number[];
	const confidentPitchHzs = pitchesFetched
		.filter((pitch, i) => {
			const confidence = 1.0 - uncertainties[i];
			return confidence >= CONF_THRESHOLD;
		})
		.map((pitch) => getPitchHz(pitch));

	pitches.set(confidentPitchHzs);
}
