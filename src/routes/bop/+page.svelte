<script lang="ts">
	import { onMount } from 'svelte';
	import { micList, micGain, analyzer, preferredMic, audioContext, gainNode } from '$lib/mic';
	import { pitches, startDemo } from '$lib/detection/model';
	import { pauNoGato, positions } from '$lib/gato';
	import Waveform from '$lib/components/Waveform.svelte';
	import { frequencyToNote } from '$lib/notes';

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
				i++;
			}
		}, 500);
	});

	function demoThing() {
		startDemo();

		setInterval(() => {
			console.log($pitches);
		}, 100);
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

<div class="w-full h-40">
	<Waveform {bufferLength} {dataArray} />
</div>
<!-- <div class="w-full h-40">
	<Spectogram {dataArray} />
</div> -->

<!-- <div class="w-full h-40">
	<Waterfall {dataArray} />
</div> -->

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
