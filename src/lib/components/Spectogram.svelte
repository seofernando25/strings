<script lang="ts">
	import MATLAB_JET from '$lib/spectogram/matlabJet';
	import { onMount } from 'svelte';

	export let dataArray: Uint8Array = new Uint8Array(0);
	export let rhc = true; // right hand column
	export let vert = true; // vertical display

	let canvas: HTMLCanvasElement;
	$: canvasCtx = canvas?.getContext('2d', {
		willReadFrequently: true
	});
	let width = 1;
	let height = 1;

	let nextLine = 0;
	let interval = 0; // msec
	let sgTime = 0;
	let sgStartTime = 0;
	let sgDiff = 0;
	let running = false;
	let sgMode: 'WF' | 'RS' = 'WF';
	let timerID: null | ReturnType<typeof setTimeout> = null;
	let lineRate = 100; // requested line rate for dynamic waterfalls

	$: {
		setLineRate(lineRate);
	}

	let tmpImgData: ImageData | null = null;

	$: lineBuf = new ArrayBuffer(height * 4); // 1 line
	$: lineBuf8 = new Uint8ClampedArray(lineBuf);
	$: lineImgData = new ImageData(lineBuf8, height, 1); // 1 line of canvas pixels

	$: blankBuf = new ArrayBuffer(height * 4);
	$: blankBuf8 = new Uint8ClampedArray(blankBuf);
	$: blankImgData = new ImageData(blankBuf8, height, 1);

	let startOfs = 0;

	function newLine() {
		horizontalNewLine();
		// return vert ? verticalNewLine() : horizontalNewLine();
	}

	function verticalNewLine() {
		if (!canvasCtx) return;
		if (sgMode == 'WF') {
			if (rhc) {
				// shift the current display down 1 line, oldest line drops off
				tmpImgData = canvasCtx.getImageData(0, 0, height, width - 1);
				canvasCtx.putImageData(tmpImgData, 0, 1);
			} else {
				// shift the current display up 1 line, oldest line drops off
				tmpImgData = canvasCtx.getImageData(0, 1, height, width - 1);
				canvasCtx.putImageData(tmpImgData, 0, 0);
			}
		}

		for (
			let sigVal, rgba, opIdx = 0, ipIdx = startOfs;
			ipIdx < height + startOfs;
			opIdx += 4, ipIdx++
		) {
			sigVal = dataArray[ipIdx] || 0; // if input line too short add zeros
			rgba = MATLAB_JET[sigVal]; // array of rgba values
			// byte reverse so number aa bb gg rr
			lineBuf8[opIdx] = rgba[0]; // red
			lineBuf8[opIdx + 1] = rgba[1]; // green
			lineBuf8[opIdx + 2] = rgba[2]; // blue
			lineBuf8[opIdx + 3] = rgba[3]; // alpha
		}
		canvasCtx.putImageData(lineImgData, 0, nextLine);
		if (sgMode === 'RS') {
			incrementLine();
			// if not static draw a white line in front of the current line to indicate new data point
			if (lineRate) {
				canvasCtx.putImageData(blankImgData, 0, nextLine);
			}
		}
	}

	function horizontalNewLine() {
		if (!canvasCtx) return;
		if (sgMode == 'WF') {
			if (rhc) {
				// shift the current display right 1 line, oldest line drops off
				tmpImgData = canvasCtx.getImageData(0, 0, width - 1, height);
				canvasCtx.putImageData(tmpImgData, 1, 0);
			} else {
				// shift the current display left 1 line, oldest line drops off
				tmpImgData = canvasCtx.getImageData(1, 0, width - 1, height);
				canvasCtx.putImageData(tmpImgData, 0, 0);
			}
		}
		// refresh the page image (it was just shifted)
		const pageImgData = canvasCtx.getImageData(0, 0, width, height);

		for (let sigVal, rgba, opIdx, ipIdx = 0; ipIdx < height; ipIdx++) {
			sigVal = dataArray[ipIdx + startOfs] || 0; // if input line too short add zeros
			rgba = MATLAB_JET[sigVal]; // array of rgba values
			opIdx = 4 * ((height - ipIdx - 1) * width + nextLine);
			// byte reverse so number aa bb gg rr
			pageImgData.data[opIdx] = rgba[0]; // red
			pageImgData.data[opIdx + 1] = rgba[1]; // green
			pageImgData.data[opIdx + 2] = rgba[2]; // blue
			pageImgData.data[opIdx + 3] = rgba[3]; // alpha
		}
		if (sgMode === 'RS') {
			incrementLine();
			// if not draw a white line in front of the current line to indicate new data point
			if (lineRate) {
				for (let j = 0; j < height; j++) {
					let opIdx: number;
					if (rhc) {
						opIdx = 4 * (j * width + nextLine);
					} else {
						opIdx = 4 * ((height - j - 1) * width + nextLine);
					}
					// byte reverse so number aa bb gg rr
					pageImgData.data[opIdx] = 255; // red
					pageImgData.data[opIdx + 1] = 255; // green
					pageImgData.data[opIdx + 2] = 255; // blue
					pageImgData.data[opIdx + 3] = 255; // alpha
				}
			}
		}
		canvasCtx.putImageData(pageImgData, 0, 0);
	}

	function incrementLine() {
		if ((vert && !rhc) || (!vert && rhc)) {
			nextLine++;
			if (nextLine >= width) {
				nextLine = 0;
			}
		} else {
			nextLine--;
			if (nextLine < 0) {
				nextLine = width - 1;
			}
		}
	}

	function updateWaterfall() {
		newLine();
		sgTime += interval;
		sgDiff = Date.now() - sgStartTime - sgTime;
		if (running) {
			timerID = setTimeout(updateWaterfall, interval - sgDiff);
		}
	}

	function stop() {
		running = false;
		if (timerID) {
			clearTimeout(timerID);
		}
		// reset where the next line is to be written
		if (sgMode === 'RS') {
			if (vert) {
				nextLine = rhc ? width - 1 : 0;
			} else {
				nextLine = rhc ? 0 : width - 1;
			}
		} // WF
		else {
			nextLine = rhc ? 0 : width - 1;
		}
	}

	function start() {
		sgStartTime = Date.now();
		sgTime = 0;
		running = true;
		updateWaterfall(); // start the update loop
	}

	function clear() {
		canvasCtx?.clearRect(0, 0, width, height);
		// make a white line, it will show the input line for RS displays
		// blankBuf8.fill(255);
		// make a full canvas of the color map 0 values
		// for (let i = 0; i < pxPerLine * lines * 4; i += 4) {
		// byte reverse so number aa bb gg rr
		// clearBuf8[i] = MATLAB_JET[0][0]; // red
		// clearBuf8[i + 1] = MATLAB_JET[0][1]; // green
		// clearBuf8[i + 2] = MATLAB_JET[0][2]; // blue
		// clearBuf8[i + 3] = MATLAB_JET[0][3]; // alpha
		// }

		// canvasCtx?.putImageData(clearImgData, 0, 0);
	}

	function setLineRate(newRate: number) {
		if (isNaN(newRate) || newRate > 999 || newRate < 0) {
			console.error('invalid line rate [0 <= lineRate < 50 lines/sec]');
			// don't change the lineRate;
		} else if (newRate === 0) {
			// static (one pass) raster
			lineRate = 0;
		} else {
			lineRate = newRate;
			interval = 1000 / lineRate; // msec
		}
	}

	onMount(() => {
		// Set willreadfrequently to true to allow the browser to optimize the canvas

		clear();
		start();
	});
</script>

<div bind:clientHeight={height} bind:clientWidth={width} class="w-full h-full">
	<canvas bind:this={canvas} {width} {height} />
</div>
