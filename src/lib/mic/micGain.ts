import { computed, effect, signal } from '@preact/signals-core';
import { get } from 'svelte/store';
import { monoMicNode } from './monoMicNode';
import { toneContext } from './toneContext';
export const micGain = signal(1);



export const gainNode = computed(() => {
	const ctx = toneContext.value;
	if (ctx === undefined) {
		return;
	}

	const mic = monoMicNode.value;
	if (!mic) return;

	// Create gain node
	let gNode = ctx.createGain();
	gNode.gain.value = micGain.value;
	mic.connect(gNode);
	return gNode;
});


effect(() => {
	const node = gainNode.value;
	if (node !== undefined) {
		node.gain.value = micGain.value;
		return;
	} 
})

export default micGain;
