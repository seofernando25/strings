import { signal } from "@preact/signals-core";
import analyzer from "./analyzer";


export let audioFrequencies = new Uint8Array(0);
export const audioFrequenciesTick = signal(0);

export function weightedAudioFrequencyIndex(index: number) {
	// Given a floating number eg: 1.24 will return audioFrequencies[1] * (1 - 0.24) + audioFrequencies[2] * 0.24
	const low = Math.floor(index);
	const high = Math.ceil(index);
	const weight = index - low;
	const r = audioFrequencies[low] * (1 - weight) + audioFrequencies[high] * weight;
	if (!Number.isFinite(r)) {
		return audioFrequencies[low];
	}
	return r;
}

export function windowAverageFrequency(midIndex: number) {
	const WINDOW = 2;
	let sum = 0;
	for (let i = midIndex - WINDOW; i <= midIndex + WINDOW; i++) {
		sum += weightedAudioFrequencyIndex(i);
	}
	return sum / (2 * WINDOW + 1);
}



// setInterval(() => {
// 	if (analyzer.value?.frequencyBinCount !== audioFrequencies.length) {
// 		audioFrequencies = new Uint8Array(analyzer.value?.frequencyBinCount);
// 	}

// 	analyzer.value.getByteFrequencyData(audioFrequencies);
// 	audioFrequenciesTick.value++;
// }, 16);

function updateAudioFrequencies() {
	if (analyzer.value?.frequencyBinCount !== audioFrequencies.length) {
		audioFrequencies = new Uint8Array(analyzer.value?.frequencyBinCount);
	}

	analyzer.value.getByteFrequencyData(audioFrequencies);
	audioFrequenciesTick.value++;
	requestAnimationFrame(updateAudioFrequencies);
}

updateAudioFrequencies();

