import { computed } from '@preact/signals-core';

import { gainNode } from './micGain';
import { toneContext } from './toneContext';

export const analyzer = computed(() => {
	let analyzer = toneContext.value.createAnalyser();
	analyzer.fftSize = 16384;
	gainNode.value?.connect(analyzer);
	return analyzer;
});

export default analyzer;
