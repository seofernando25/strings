<script lang="ts">
	import { onMount } from 'svelte';
	import { analyzer, gainNode } from '$lib/mic';
	import { pitches } from '$lib/detection/model';
	import Waveform from '$lib/components/Waveform.svelte';
	import { noteToFreqSimple, type Note, type ChromaticNote } from '$lib/notes';
	import Tuner from '$lib/components/Tuner.svelte';
	import { BASE_TUNINGS } from '$lib/tunings';
	import * as Tone from 'tone';

	// Runes are global

	const bufferLength = $derived($analyzer ? $analyzer.frequencyBinCount : 0);
	let dataArray = $state(new Uint8Array(bufferLength));

	// Effect to resize dataArray if bufferLength changes
	$effect(() => {
		if (dataArray.length !== bufferLength) {
			dataArray = new Uint8Array(bufferLength);
		}
	});

	const limit = 10;
	let notes = $state<number[]>([]);

	let selectedTuning = $state(0);
	let currentString = $state(0);

	// State for derived tuning note properties
	let curTuningNoteName = $state<ChromaticNote>('E');
	let curTuningNoteOctave = $state(4);

	// Effect to update tuning note based on selections
	$effect(() => {
		const selected = BASE_TUNINGS[selectedTuning].notes[currentString];
		if (selected.length == 2) {
			curTuningNoteName = selected[0] as ChromaticNote;
			curTuningNoteOctave = Number(selected[1]);
		} else {
			curTuningNoteName = selected.slice(0, 2) as ChromaticNote;
			curTuningNoteOctave = Number(selected[2]);
		}
	});

	// Derived state for the full tuning note object
	const curTuningNote = $derived({
		note: curTuningNoteName,
		octave: curTuningNoteOctave,
		cents: 0,
		freq: noteToFreqSimple(curTuningNoteName, curTuningNoteOctave, 0)
	} satisfies Note);

	// State for last valid pitch, updated by effect
	let lastValidPitch = $state(0);
	$effect(() => {
		if ($pitches.length > 0) {
			lastValidPitch = $pitches.reduce((a, b) => a + b) / $pitches.length;
		} else {
			// Reset if pitches is empty? Or keep last value?
			// Keeping last value for now, adjust if needed.
		}
	});

	onMount(() => {
		const pitchesSub = pitches.subscribe((pitchesList) => {
			let currentNotes = notes; 
			pitchesList.forEach((pitch) => {
				currentNotes.push(pitch);
			});

			if (currentNotes.length > limit) {
				currentNotes = currentNotes.slice(currentNotes.length - limit, currentNotes.length);
			}
			notes = currentNotes; 
		});

		// Let TypeScript infer interval ID types
		let intervalId1: ReturnType<typeof setInterval>;
		let intervalId2: ReturnType<typeof setInterval>;

		const setup = async () => {
			let node = $gainNode;
			let audioCtx = Tone.getContext();
			if (!node || !audioCtx || !$analyzer) return;

			node.connect(audioCtx.rawContext.destination);
			intervalId1 = setInterval(() => {
				if($analyzer) {
					$analyzer.getByteTimeDomainData(dataArray);
					dataArray = dataArray; 
				}
			}, 50);

			let timeInTune = 0;
			let requiredTime = 500;
			let window = 1;
			intervalId2 = setInterval(() => {
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
		};

		setup();

		// Cleanup
		return () => {
			pitchesSub(); 
			if (intervalId1 !== undefined) clearInterval(intervalId1);
			if (intervalId2 !== undefined) clearInterval(intervalId2);
		};
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
				onclick={() => { currentString = i; }} >{note}</button
			>
		{/each}
	</div>

	<Tuner expected={curTuningNote.freq} value={lastValidPitch} />

	<div class="w-full h-40">
		<Waveform {bufferLength} {dataArray} />
	</div>
</div>
