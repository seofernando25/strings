<script lang="ts">
	import Spectogram from '$lib/components/Spectogram.svelte';
	import { analyzer, gainNode } from '$lib/mic';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	$: bufferLength = $analyzer ? $analyzer.frequencyBinCount : 0;
	$: dataArray = new Uint8Array(bufferLength);

	onMount(async () => {
		const tone = await import('tone');
		let node = $gainNode;
		let audioCtx = tone.getContext();
		if (!node) return;
		if (!audioCtx) return;

		node.connect(audioCtx.rawContext.destination);
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
	{#if browser}
		<!-- content here -->
		<Spectogram {dataArray}></Spectogram>
	{/if}
</div>
