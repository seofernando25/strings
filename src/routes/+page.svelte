<script lang="ts">
	import { onMount } from 'svelte';
	import { micList, micGain, analyzer, preferredMic, audioContext, gainNode } from '../lib/mic';
	import { pitches, startDemo } from '$lib/detection/model';
	import { pauNoGato, positions } from '$lib/gato';
	import { min } from '@tensorflow/tfjs';

	let canvas: HTMLCanvasElement;
	$: bufferLength = $analyzer ? $analyzer.frequencyBinCount : 0;
	$: dataArray = new Uint8Array(bufferLength);
	$: pitchesAsNotes = $pitches.map((pitch) => frequencyToNote(pitch));

	const limit = 10;
	let notes: number[] = [];

	$: minNote = Math.min(...[...notes]);
	$: maxNote = Math.max(...[...notes]);

	let i = 0;

	onMount(async () => {
		pitches.subscribe((pitchesList) => {
			pitchesList.forEach((pitch) => {
				notes.push(pitch);
			});

			if (notes.length > limit) {
				notes = notes.slice(notes.length - limit, notes.length);
			}
			notes = notes;
		});

		let node = $gainNode;
		let audioCtx = $audioContext;
		if (!node) return;
		if (!audioCtx) return;

		node.connect(audioCtx.destination);
		setInterval(() => {
			$analyzer?.getByteTimeDomainData(dataArray);
			dataArray = dataArray;
		}, 50);

		setInterval(() => {
			let expectedNote = pauNoGato[i];
			if (pitchesAsNotes.includes(expectedNote)) {
				console.log('got it');
				i++;
			}
		}, 500);

		render();
	});

	function render() {
		let canvasCtx = canvas?.getContext('2d');
		if (!canvasCtx) return;

		canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

		canvasCtx.fillStyle = 'rgb(200, 200, 200)';
		canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

		canvasCtx.lineWidth = 2;
		canvasCtx.strokeStyle = 'rgb(0, 0, 0)';
		canvasCtx.beginPath();

		const sliceWidth = (canvas.width * 1.0) / bufferLength;
		let x = 0;

		for (let i = 0; i < bufferLength; i++) {
			const v = dataArray[i] / 128.0;
			const y = v * (canvas.height / 2);

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

	function demoThing() {
		startDemo();

		setInterval(() => {
			console.log($pitches);
		}, 100);
	}

	/**
	 * Converts a frequency to a note
	 * eg. 82.41 -> E2
	 * eg. 110 -> A2
	 * @param hz
	 */
	function frequencyToNote(hz: number): string {
		var A4 = 440.0;
		var A4_INDEX = 57;
		const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
		let notes: string[] = [];
		for (let i = 0; i < 9; i++) {
			noteNames.forEach((note) => {
				notes.push(note + i);
			});
		}

		var MINUS = 0;
		var PLUS = 1;

		var frequency;
		var r = Math.pow(2.0, 1.0 / 12.0);
		var cent = Math.pow(2.0, 1.0 / 1200.0);
		var r_index = 0;
		var cent_index = 0;
		var side;

		frequency = A4;

		if (hz >= frequency) {
			while (hz >= r * frequency) {
				frequency = r * frequency;
				r_index++;
			}
			while (hz > cent * frequency) {
				frequency = cent * frequency;
				cent_index++;
			}
			if (cent * frequency - hz < hz - frequency) cent_index++;
			if (cent_index > 50) {
				r_index++;
				cent_index = 100 - cent_index;
				if (cent_index != 0) side = MINUS;
				else side = PLUS;
			} else side = PLUS;
		} else {
			while (hz <= frequency / r) {
				frequency = frequency / r;
				r_index--;
			}
			while (hz < frequency / cent) {
				frequency = frequency / cent;
				cent_index++;
			}
			if (hz - frequency / cent < frequency - hz) cent_index++;
			if (cent_index >= 50) {
				r_index--;
				cent_index = 100 - cent_index;
				side = PLUS;
			} else {
				if (cent_index != 0) side = MINUS;
				else side = PLUS;
			}
		}

		var result = notes[A4_INDEX + r_index];
		// if (side == PLUS) result = result + ' plus ';
		// else result = result + ' minus ';
		// result = result + cent_index + ' cents';
		return result;
	}

	let pitchTestVal = 82;
</script>

<!-- <button class="btn w-full btn-primary h-40" on:click={initAudio}> AAA</button> -->

<button class="btn btn-primary btn-wide m-2" on:click={demoThing}>Start Demo</button>

<p>Volume</p>
<input class="range" bind:value={$micGain} type="range" min="0" max="2" step="0.1" />

<div>
	<select bind:value={$preferredMic}>
		<option value={undefined}>Select a microphone</option>
		{#each $micList as mic}
			<option value={mic}>{mic.label}</option>
		{/each}
	</select>
</div>
<div>
	<span
		>Selected:
		{#if $preferredMic}
			{$preferredMic.label}
		{:else}
			None
		{/if}
	</span>
</div>
<div />

<canvas bind:this={canvas} width="500" height="100" />

<!-- Show the first 50 elements of the fft -->
<div class="w-full flex gap-2">
	{#each $pitches as pitch}
		<!-- <span>{pitch}</span> -->
		<!-- Rounded to int -->
		<span class="bg-gray-200 text-primary rounded-full px-2">{frequencyToNote(pitch)}</span>
	{/each}
</div>

<span>Min Note: {minNote}</span>
<span>Max Note: {maxNote}</span>

<input
	bind:value={pitchTestVal}
	class="input input-bordered m-2"
	type="text"
	placeholder="Pithc in hz"
/>

<span>{frequencyToNote(pitchTestVal)}</span>

<div class="flex gap-2 flex-col rounded p-2 m-2 bg-base-200">
	<span>Notes List</span>
	<div class="flex flex-wrap">
		{#each pauNoGato as note, cur}
			{#if i < cur}
				<span class="bg-gray-200 text-primary rounded-full px-2">{note}</span>
			{:else if i === cur}
				<span class="bg-blue-200 text-primary rounded-full px-2">{note}</span>
			{:else}
				<span class="bg-green-200 text-primary rounded-full px-2">{note}</span>
			{/if}
		{/each}
	</div>
	<span class="self-center btn btn-primary btn-wide">Play: {pauNoGato[i]}</span>
</div>

<!-- 5-8 hz-->

<div class="grid grid-cols-4 place-items-center">
	<div>
		{#if positions[pauNoGato[i]] === 0}
			<span class="btn btn-primary">+</span>
		{:else}
			<span class="btn btn-outline">+</span>
		{/if}
	</div>
	<div>
		{#if positions[pauNoGato[i]] === 1}
			<span class="btn btn-primary">+</span>
		{:else}
			<span class="btn btn-outline">+</span>
		{/if}
	</div>
	<div>
		{#if positions[pauNoGato[i]] === 2}
			<span class="btn btn-primary">+</span>
		{:else}
			<span class="btn btn-outline">+</span>
		{/if}
	</div>
	<div>
		{#if positions[pauNoGato[i]] === 3}
			<span class="btn btn-primary">+</span>
		{:else}
			<span class="btn btn-outline">+</span>
		{/if}
	</div>
</div>
