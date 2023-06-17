<script lang="ts">
	import { onMount } from 'svelte';

	export let dataArray: Uint8Array = new Uint8Array(0);

	let prevCanvasBitmap: ImageBitmap | null = null;

	let canvas: HTMLCanvasElement;
	let width = 0;
	let height = 0;

	// Render the spectrogram
	async function render() {
		let canvasCtx = canvas?.getContext('2d');
		if (!canvasCtx) return;

		// Save the current canvas as a bitmap
		if (prevCanvasBitmap) {
			prevCanvasBitmap.close();
		}
		prevCanvasBitmap = await createImageBitmap(canvas);
		// Paste the bitmap onto the canvas shifted by 1 pixel
		canvasCtx.drawImage(prevCanvasBitmap, -1, 0);

		// Draw the new column
		if (dataArray.length === 0) {
			requestAnimationFrame(render);
			return;
		}

		let pixelSize = Math.floor(canvas.height / dataArray.length);
		let y = 0;
		while (y < canvas.height) {
			// Draw a vertical line of pixelSize
			let value = dataArray[y / pixelSize];
			let color = `rgb(${value}, ${value}, ${value})`;
			canvasCtx.fillStyle = color;
			canvasCtx.fillRect(canvas.width - 1, y, 1, pixelSize);
			y += pixelSize;
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
