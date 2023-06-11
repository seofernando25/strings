import { type Writable, writable, get } from 'svelte/store';
import { audioContext } from './audioContext';
import { browser } from '$app/environment';
import rawMicNode from './rawMicNode';

export const monoMicNode: Writable<ChannelMergerNode | undefined> = writable(undefined, (set) => {
	let splitter: ChannelSplitterNode | undefined = undefined;
	let merger: ChannelMergerNode | undefined = undefined;
	let audioSub: () => void;
	let micSub: () => void;

	if (browser) {
		const updateMic = async () => {
			const ctx = get(audioContext);
			if (!ctx) return;
			const mic = get(rawMicNode);
			if (!mic) return;

			splitter?.disconnect();
			merger?.disconnect();
			if (!ctx) return;
			splitter = ctx.createChannelSplitter(2);
			merger = ctx.createChannelMerger(1);

			mic.connect(splitter);
			splitter.connect(merger, 0, 0);
			splitter.connect(merger, 1, 0);
			set(merger as unknown as undefined);
		};

		micSub = rawMicNode.subscribe(updateMic);
	}

	return () => {
		audioSub?.();
		micSub?.();
		splitter?.disconnect();
		merger?.disconnect();
	};
});
