<script lang="ts">
	import { onMount } from 'svelte';
	import { micList, analyzer, preferredMic, gainNode } from '$lib/mic';
	import { pitches } from '$lib/detection/model';
	import Waveform from '$lib/components/Waveform.svelte';
	import { noteToFreqSimple, type Note, type ChromaticNote } from '$lib/notes';
	import Tuner from '$lib/components/Tuner.svelte';
	import { BASE_TUNINGS } from '$lib/tunings';
	import * as Tone from 'tone';

	$: bufferLength = $analyzer ? $analyzer.frequencyBinCount : 0;
	$: dataArray = new Uint8Array(bufferLength);

	const limit = 10;
	let notes: number[] = [];

	let selectedTuning = 0;
	let currentString = 0;

	$: curTuningNoteName = 'E' as ChromaticNote;
	$: curTuningNoteOctave = 4;

	$: {
		const selected = BASE_TUNINGS[selectedTuning].notes[currentString];

		if (selected.length == 2) {
			curTuningNoteName = selected[0] as ChromaticNote;
			curTuningNoteOctave = Number(selected[1]);
		} else {
			curTuningNoteName = selected.slice(0, 2) as ChromaticNote;
			curTuningNoteOctave = Number(selected[2]);
		}
	}

	$: curTuningNote = {
		note: curTuningNoteName,
		octave: curTuningNoteOctave,
		cents: 0,
		freq: noteToFreqSimple(curTuningNoteName, curTuningNoteOctave, 0)
	} satisfies Note;

	// Average pitches (if pitches len is 0 it will be 0)
	$: lastValidPitch = 0;
	$: {
		if ($pitches.length > 0) {
			lastValidPitch = $pitches.reduce((a, b) => a + b) / $pitches.length;
		}
	}

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
		let audioCtx = Tone.getContext();
		if (!node) return;
		if (!audioCtx) return;

		node.connect(audioCtx.rawContext.destination);
		setInterval(() => {
			$analyzer?.getByteTimeDomainData(dataArray);
			dataArray = dataArray;
		}, 50);

		let timeInTune = 0;
		let requiredTime = 500;
		let window = 1;
		setInterval(() => {
			if ($pitches.length === 0) {
				timeInTune = 0;
				return;
			}

			let curPitch = $pitches.reduce((a, b) => a + b) / $pitches.length;
			if (Math.abs(curPitch - curTuningNote.freq) < window) {
				timeInTune += 100;
			} else {
				timeInTune = 0;
			}

			if (timeInTune > requiredTime) {
				timeInTune = 0;
				currentString = (currentString + 1) % BASE_TUNINGS[selectedTuning].notes.length;
				console.log(currentString);
			}
		}, 100);
	});
</script>

<div class="container mx-auto flex flex-col gap-3">
	<select class="select select-bordered" bind:value={selectedTuning}>
		{#each BASE_TUNINGS as tuning, i}
			<option value={i}>{tuning.name}</option>
		{/each}
	</select>

	<div class="flex gap-2">
		{#each BASE_TUNINGS[selectedTuning].notes as note, i}
			<button
				class="btn btn-sm btn-primary"
				class:btn-accent={i === currentString}
				on:click={() => {
					currentString = i;
				}}>{note}</button
			>
		{/each}
	</div>

	<Tuner expected={curTuningNote.freq} value={lastValidPitch} />

	<div class="w-full h-40">
		<Waveform {bufferLength} {dataArray} />
	</div>
</div>
