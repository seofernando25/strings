import { signal } from "@preact/signals-core";
import analyzer from "./analyzer";


export let audioFrequencies = new Uint8Array(0);
export const audioFrequenciesTick = signal(0);

setInterval(() => {
	if (analyzer.value?.frequencyBinCount !== audioFrequencies.length) {
		audioFrequencies = new Uint8Array(analyzer.value?.frequencyBinCount);
	}

	analyzer.value.getByteFrequencyData(audioFrequencies);
	audioFrequenciesTick.value++;
}, 16);