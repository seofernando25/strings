import { get, writable, type Writable } from 'svelte/store';
import { browser } from '$app/environment';
import { audioContext } from './audioContext';
import { monoMicNode } from './monoMicNode';

export const micGain: Writable<number> = writable(1);

export const gainNode: Writable<GainNode | undefined> = writable(undefined, (set) => {
	let monoMicSub: () => void;
	let micGainSub: () => void;
	let gNode: GainNode | undefined = undefined;

	if (browser) {
		const createGainNode = async () => {
			const ctx = get(audioContext);
			if (!ctx) return;
			const mic = get(monoMicNode);
			if (!mic) return;

			// Create gain node
			gNode = get(gainNode);
			if (gNode === undefined) {
				gNode = ctx.createGain();
			}
			gNode.gain.value = get(micGain);
			mic.connect(gNode);

			set(gNode as unknown as undefined);
		};

		const updateGain = () => {
			const node = get(gainNode);
			if (node !== undefined) {
				node.gain.value = get(micGain);
			}
		};

		micGainSub = micGain.subscribe(updateGain);
		monoMicSub = monoMicNode.subscribe(createGainNode);
	}

	return () => {
		monoMicSub?.();
		micGainSub?.();
		gNode?.disconnect();
	};
});

async function createGainNode() {
	let node = get(gainNode);
	if (node !== undefined) {
		return;
	}

	const audioCtx = get(audioContext);
	if (audioCtx === undefined) {
		return;
	}

	node = audioCtx.createGain();
	node.gain.value = get(micGain);
	gainNode.set(node);
}

async function updateGain() {
	const node = get(gainNode);
	if (node !== undefined) {
		node.gain.value = get(micGain);
		return;
	} else {
		await createGainNode();
	}
}

if (browser) {
	micGain.subscribe(updateGain);
}

export default micGain;
