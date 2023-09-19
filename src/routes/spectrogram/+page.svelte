<script lang="ts">
	import Spectogram from '$lib/components/Spectogram.svelte';
	import { analyzer, audioContext, gainNode } from '$lib/mic';

	import { onMount } from 'svelte';
	$: bufferLength = $analyzer ? $analyzer.frequencyBinCount : 0;
	$: dataArray = new Uint8Array(bufferLength);

	onMount(async () => {
		let node = $gainNode;
		let audioCtx = $audioContext;
		if (!node) return;
		if (!audioCtx) return;

		node.connect(audioCtx.destination);
		setInterval(() => {
			$analyzer?.getByteFrequencyData(dataArray);
			dataArray = dataArray;
		}, 16);
	});
</script>

<div class="w-full break-all">
	{dataArray}
</div>
<div class="bg-red-50 h-[50%]">
	<Spectogram {dataArray}></Spectogram>
</div>
