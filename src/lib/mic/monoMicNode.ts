import { effect, signal } from '@preact/signals-core';
import rawMicNode from './rawMicNode';
import { toneContext } from './toneContext';

export const monoMicNode = signal<ChannelMergerNode | undefined>(undefined);


effect(() => {
	// Check if we have everything we need
	const mic = rawMicNode.value;
	const audioCtx = toneContext.value;
	if (mic === undefined || audioCtx === undefined) {
		monoMicNode.value = undefined;
		return;
	}
	// Check if monoMic is not already set
	if (monoMicNode.value !== undefined) {
		return;
	}

	const splitter = audioCtx.createChannelSplitter(2);
	const merger = audioCtx.createChannelMerger(1);

	mic.connect(splitter);
	splitter.connect(merger, 0, 0);
	splitter.connect(merger, 1, 0);
	monoMicNode.value = merger;
});
