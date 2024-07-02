<script lang="ts">
	import { onMount } from 'svelte';

	export let dataArray: Uint8Array = new Uint8Array(0);
	$: bufferLength = dataArray.length;

	let canvas: HTMLCanvasElement;
	let width = 0;
	let height = 0;

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

		canvasCtx.lineWidth = 1;
		canvasCtx.strokeStyle = 'rgb(255, 255, 255)';
		canvasCtx.beginPath();

		const sliceWidth = canvas.width / bufferLength;
		let x = 0;

		for (let i = 0; i < bufferLength; i++) {
			const v = dataArray[i];
			const y = canvas.height / 2 + v - 128.0;

			if (i === 0) {
				canvasCtx.moveTo(x, y);
			} else {
				canvasCtx.lineTo(x, y);
			}

			x += sliceWidth;
		}

		canvasCtx.lineTo(canvas.width, canvas.height / 2);
		canvasCtx.stroke();

		requestAnimationFrame(render);
	}

	onMount(() => {
		render();
	});
</script>

<div bind:clientHeight={height} bind:clientWidth={width} class="w-full h-full">
	<canvas bind:this={canvas} {width} {height} />
</div>
