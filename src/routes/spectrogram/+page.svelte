<script lang="ts">
	import Spectogram from '$lib/components/Spectogram.svelte';
	import { analyzer } from '$lib/mic';
	import { browser } from '$app/environment';

	// Reactive state using runes
	const bufferLength = $derived($analyzer ? $analyzer.frequencyBinCount : 0);
	let dataArray = $state(new Uint8Array(0)); // Initialized empty, $effect will resize

	// Effect to resize dataArray when bufferLength changes
	$effect(() => {
		// Ensure bufferLength is valid before resizing
		if (bufferLength > 0 && dataArray.length !== bufferLength) {
			console.log(`Resizing dataArray to ${bufferLength}`);
			dataArray = new Uint8Array(bufferLength);
		}
	});

	// Effect to continuously update dataArray
	$effect(() => {
		const currentAnalyzer = $analyzer;
		// Only run if analyzer is available and dataArray has been initialized
		if (currentAnalyzer && dataArray.length > 0) {
			console.log("Starting interval to update dataArray");
			const intervalId = setInterval(() => {
				// Create a temporary array to hold the new data
				const newData = new Uint8Array(bufferLength); 
				currentAnalyzer.getByteFrequencyData(newData);
				// Assign the new data to trigger reactivity
				dataArray = newData; 
			}, 50); // Update rate ~20fps

			// Cleanup function for the effect
			return () => {
				console.log("Clearing interval for dataArray update");
				clearInterval(intervalId);
			};
		} else {
			console.log("Analyzer not ready or dataArray not initialized");
		}
	});
</script>

<div class="w-full break-all">
	{dataArray.length > 0 ? dataArray.slice(0, 100).join(', ') + '...' : 'Waiting for data...'}
</div>
<div class="bg-base-200 h-[50%]">
	{#if browser && dataArray.length > 0}
		<Spectogram {dataArray}></Spectogram>
	{/if}
</div>
