<script lang="ts">
	import { onMount } from 'svelte';

	export let dataArray: Uint8Array = new Uint8Array(0);

	let canvas: HTMLCanvasElement;
	let width = 0;
	let height = 0;

	// Render the spectrogram
	function render() {
		let canvasCtx = canvas?.getContext('2d');
		if (!canvasCtx) return;

		canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

		if (dataArray.length === 0) {
			let fontSize = Math.ceil(canvas.width / 10);
			canvasCtx.font = `${fontSize}px sans-serif`;
			canvasCtx.fillStyle = 'rgb(255, 255, 255)';
			canvasCtx.fillText('No data', 10, canvas.height - 10);
			requestAnimationFrame(render);
			return;
		}

		// Set up the spectrogram parameters
		const numBins = 256; // Number of frequency bins
		const timeSlots = 512; // Number of time slots
		const binWidth = Math.floor(dataArray.length / numBins);
		const timeSlotWidth = Math.floor(dataArray.length / timeSlots);

		// Create a 2D array to hold the spectrogram data
		const spectrogram: number[][] = [];
		for (let i = 0; i < numBins; i++) {
			spectrogram[i] = new Array(timeSlots).fill(0);
		}

		// Compute the spectrogram data
		for (let i = 0; i < numBins; i++) {
			for (let j = 0; j < timeSlots; j++) {
				let sum = 0;
				for (let k = 0; k < binWidth; k++) {
					sum += dataArray[i * binWidth + k + j * timeSlotWidth];
				}
				spectrogram[i][j] = sum / binWidth;
			}
		}

		// Draw the spectrogram
		const spectrogramWidth = canvas.width;
		const spectrogramHeight = canvas.height;
		const binHeight = spectrogramHeight / numBins;

		for (let i = 0; i < numBins; i++) {
			for (let j = 0; j < timeSlots; j++) {
				const value = spectrogram[i][j];
				const x = (j * spectrogramWidth) / timeSlots;
				const y = spectrogramHeight - (i + 1) * binHeight;
				const color = `rgb(${value}, ${value}, ${value})`;
				canvasCtx.fillStyle = color;
				canvasCtx.fillRect(x, y, spectrogramWidth / timeSlots, binHeight);
			}
		}

		requestAnimationFrame(render);
	}

	onMount(() => {
		render();
	});
</script>

<div bind:clientHeight={height} bind:clientWidth={width} class="w-full h-full">
	<canvas bind:this={canvas} {width} {height} />
</div>
