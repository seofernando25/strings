<script lang="ts">
	import { onMount } from 'svelte';
	import { analyzer, gainNode } from '$lib/mic';
	import { noteToFreqSimple, type Note, type ChromaticNote } from '$lib/notes';
	import { BASE_TUNINGS } from '$lib/tunings';
	import { toneContext } from '$lib/mic/toneContext';
	import Tuner from '$lib/components/Tuner.svelte';
	import Waveform from '$lib/components/Waveform.svelte';
	import { audioFrequencies, audioFrequenciesTick } from '$lib/mic/audioFrequencies';
	import { micSampleRate } from '$lib/mic/rawMicNode';
	import Spectogram from '$lib/components/Spectogram.svelte';

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

	let lastValidPitch: number | undefined = undefined;

	let averageGroupedIndexes: number[] = [];
	$: {
		$audioFrequenciesTick;

		averageGroupedIndexes = findOutlierIndexes(audioFrequencies).toSorted((a, b) => a - b);
		const groupCloseIndexes = groupNumbers(averageGroupedIndexes);
		// Avg each group
		averageGroupedIndexes = groupCloseIndexes
			.reduce((acc, group) => {
				const avg = group.reduce((a, b) => a + b, 0) / group.length;
				acc.push(avg);
				return acc;
			}, [])
			.filter((idx) => audioFrequencies[Math.round(idx)] > 74);
		if (averageGroupedIndexes.length > 0) {
			const idx = Math.round(averageGroupedIndexes[0]);
			console.log('values:', audioFrequencies[idx], idx);
			const outlierHz = averageGroupedIndexes[0] * (($micSampleRate ?? 0) / analyzer.value.fftSize);
			lastValidPitch = outlierHz;
		} else {
			lastValidPitch = undefined;
		}
	}

	let dataArray = new Uint8Array(analyzer.value.fftSize);

	function groupNumbers(nums: number[]) {
		// First, sort the numbers in ascending order
		const sortedNums: number[] = nums.toSorted((a, b) => a - b);

		const result = [];
		let currentGroup: number[] = [];

		for (let i = 0; i < sortedNums.length; i++) {
			// If current group is empty, start a new group
			if (currentGroup.length === 0) {
				currentGroup.push(sortedNums[i]);
			} else {
				// Check the difference between the current number and the last number in the current group
				if (sortedNums[i] - currentGroup[currentGroup.length - 1] < 3) {
					currentGroup.push(sortedNums[i]);
				} else {
					// If the difference is 2 or more, push the current group to the result and start a new group
					result.push(currentGroup);
					currentGroup = [nums[i]];
				}
			}
		}
		// Push the last group to the result
		if (currentGroup.length > 0) {
			result.push(currentGroup);
		}

		return result;
	}

	function findOutlierIndexes(uint8Array: Uint8Array) {
		const data = Array.from(uint8Array);
		const sortedDataWithIndexes = data
			.map((value, index) => ({ value, index }))
			.sort((a, b) => a.value - b.value);
		const sortedData = sortedDataWithIndexes.map((item) => item.value);

		const q1 = sortedData[Math.floor(sortedData.length / 4)];
		const q3 = sortedData[Math.floor(sortedData.length * (3 / 4))];
		const iqr = q3 - q1;
		const lowerBound = q1 - 30 * iqr;
		const upperBound = q3 + 30 * iqr;
		// upper and lower bound should usually both be zero
		// could be usefull to check for clipping
		return sortedDataWithIndexes
			.filter((item) => item.value < lowerBound || item.value > upperBound)
			.map((item) => item.index);
	}

	// TODO:
	// - Re-add automatic not switching
	// - Update tuner to use spectrogram to better visualize pitch
	onMount(async () => {
		// pitches.subscribe((pitchesList) => {
		// 	pitchesList.forEach((pitch) => {
		// 		notes.push(pitch);
		// 	});

		// 	if (notes.length > limit) {
		// 		notes = notes.slice(notes.length - limit, notes.length);
		// 	}
		// 	notes = notes;
		// });

		let node = gainNode.value;
		let audioCtx = toneContext.value;
		if (!node) return;
		if (!audioCtx) return;

		// node.connect(audioCtx.rawContext.destination);
		setInterval(() => {
			$analyzer?.getByteTimeDomainData(dataArray);
			dataArray = dataArray;
		}, 50);

		let timeInTune = 0;
		let requiredTime = 500;
		let window = 1;
		setInterval(() => {
			// if ($pitches.length === 0) {
			// 	timeInTune = 0;
			// 	return;
			// }
			// let curPitch = $pitches.reduce((a, b) => a + b) / $pitches.length;
			// if (Math.abs(curPitch - curTuningNote.freq) < window) {
			// 	timeInTune += 100;
			// } else {
			// 	timeInTune = 0;
			// }
			// if (timeInTune > requiredTime) {
			// 	timeInTune = 0;
			// 	currentString = (currentString + 1) % BASE_TUNINGS[selectedTuning].notes.length;
			// 	console.log(currentString);
			// }
		}, 100);
	});
</script>

<div class="container mx-auto flex flex-col gap-3">
	{lastValidPitch}

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

	<Tuner expected={curTuningNote.freq} value={lastValidPitch ?? 0} />

	<!-- <div class=" bg-red-300 w-full h-40">
		<Waveform {dataArray} />
	</div> -->
	<div class=" bg-red-300 w-full h-40">
		<Spectogram dataArray={audioFrequencies}></Spectogram>
	</div>
</div>
