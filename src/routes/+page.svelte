<script lang="ts">
	import score from '$lib/assets/music.xml?raw';
	import { analyzer } from '$lib/mic';
	import { audioContextStarted } from '$lib/mic/audioContext';
	import {
		audioFrequencies,
		audioFrequenciesTick,
		weightedAudioFrequencyIndex,
		windowAverageFrequency
	} from '$lib/mic/audioFrequencies';
	import { micSampleRate } from '$lib/mic/rawMicNode';
	import { noteToFreq } from '$lib/notes';
	import {
		getSongPartEventRawTimed,
		playSongPart,
		Song,
		type MusicEvent
	} from '$lib/songParser/song';
	import { SongClock } from '$lib/songParser/songclock';
	import { findOutlierIndexes, groupNumbers } from '$lib/stat';
	import { effect } from '@preact/signals-core';
	import { onMount } from 'svelte';
	import * as Tone from 'tone';

	let synth: Tone.PolySynth | null = null;
	let song: Song | null = null;
	$: timed = [] as [number, MusicEvent][];
	let songClock: SongClock = new SongClock();
	// Only show events that have happened after the current time slice 10
	$: songPlaybackTime = 0;

	function onAnimframe() {
		songPlaybackTime += songClock?.getDelta() ?? 0;
		requestAnimationFrame(onAnimframe);
	}

	effect(() => {
		console.log('Audio Context Changed');

		const started = audioContextStarted.value;
		if (!started) {
			Tone.Transport.start();
			synth = new Tone.PolySynth(Tone.Synth, {
				volume: -8,
				oscillator: {
					type: 'amtriangle20'
				},
				portamento: 0,
				detune: 0,
				envelope: {
					attack: 0.01,
					decay: 0.2,
					release: 1,
					sustain: 0
				}
			}).toDestination();
		}
	});

	let averageGroupedIndexes: number[] = [];
	let currentFrequencies: [number, number, number][] = [];
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
			.filter((idx) => weightedAudioFrequencyIndex(idx) > 74);
		if (averageGroupedIndexes.length > 0) {
			currentFrequencies = averageGroupedIndexes.map((idx) => [
				idx, // Index in fft
				weightedAudioFrequencyIndex(idx),
				idx * (($micSampleRate ?? 0) / analyzer.value.fftSize) // Frequency in Hz
			]);
			// Sort by strenght
			currentFrequencies.sort((a, b) => b[1] - a[1]);
		} else {
			currentFrequencies = [];
		}
	}

	let musicFreqIndex = 100;

	onMount(async () => {
		song = new Song(score);
		const songPart = getSongPartEventRawTimed(song.parts.find((part) => part.id === 'P1')!);
		timed = songPart.filter(([time, event]) => event.type === 'note_play');

		songClock.setTimeline(songPart);

		let eventIndex = 0;
		const interval = setInterval(() => {
			// Check if current note is correct
			const event = timed[eventIndex][1];
			if (event.type === 'note_play') {
				// Deep clone currentFrequencies
				const currentFrequenciesCopy = currentFrequencies.map((freq) => [...freq]);
				const musicFreq = noteToFreq({
					note: event.pitch.step,
					octave: event.pitch.octave,
					cents: event.pitch.alter,
					freq: 0
				});
				// Convert freq to fft index
				musicFreqIndex = Math.round((musicFreq * analyzer.value.fftSize) / ($micSampleRate ?? 0));

				const strenght = windowAverageFrequency(musicFreqIndex);

				if (strenght > 125) {
					eventIndex++;
				}
			}
		});
		return () => clearInterval(interval);
		// songClock.addEventListener(({ time, event, remaining }) => {
		// 	songPlaybackTime = time;
		// 	timed = remaining;
		// });

		// onAnimframe();
	});

	let times: { note: number; eventT: any }[] = [];
	$: selected = 'P1';
	$: songPart = song?.parts.find((part) => part.id === selected)!;
	async function playSong() {
		const songPartMaybe = songPart;
		if (!songPartMaybe) {
			return;
		}
		playSongPart(songPartMaybe);
	}

	let isPlaying = false;
	function togglePlayback() {
		if (isPlaying) {
			Tone.Transport.pause();
			Tone.Transport.stop(0);
		} else {
			Tone.Transport.start();
		}

		isPlaying = !isPlaying;
	}
</script>

{#if song}
	<header class="bg-gray-800 text-white py-4 px-8 flex justify-between items-center">
		<h1 class="text-2xl font-bold">{song?.title} by {song?.artist}</h1>
		{#if song.parts.length > 0}
			<select bind:value={selected} class="select select-bordered w-full max-w-xs ml-4">
				{#each song?.parts as part}
					<option value={part?.id}>{part?.name}</option>
				{/each}
			</select>
		{/if}
	</header>

	<div class="p-4 flex flex-col gap-4">
		<button on:click={playSong} class="btn btn-primary w-full">Play Song</button>
		<button on:click={togglePlayback} class="btn btn-primary w-full">
			{isPlaying ? 'Click to Pause' : 'Click to Play'}
		</button>
	</div>
{/if}

<div class="flex flex-col gap-2">
	{#each times as { note, eventT }}
		<div class="flex gap-2">
			<div class="w-10">{note == 0 ? 'Rest' : note}</div>
			<div class="w-10">{eventT}</div>
		</div>
	{/each}
</div>

{songPlaybackTime}
<!-- {lastValidPitch} -->
<!-- {#each currentFrequencies as [idx, freq, hz]}
	<pre>
	{idx} {freq} {hz}
</pre>
{/each} -->

<pre>
	musicFreqIndex: {musicFreqIndex}
	{#key $audioFrequenciesTick}
		a {$audioFrequenciesTick}
		strenght: {windowAverageFrequency(musicFreqIndex)}
	{/key}
	
</pre>

<!-- timed -->
<div class="overflow-x-auto">
	<table class="table">
		<!-- head -->
		<thead>
			<tr>
				<th></th>
				<th>Time</th>
				<th>Type</th>
				<th>Note</th>
			</tr>
		</thead>
		<tbody>
			{#each timed as event, i}
				<tr>
					<th>{i}</th>
					<td>{event[0]}</td>
					<td>{event[1].type}</td>
					{#if event[1].type === 'note_play'}
						<td>
							<!-- Alter half step -->
							{event[1].pitch.step}
							<!-- note: event[1].pitch.note, -->
							{noteToFreq({
								note: event[1].pitch.step,
								octave: event[1].pitch.octave,
								cents: event[1].pitch.alter,
								freq: 0
							})}
						</td>

						<td>
							Fret: {event[1].fingerTech?.fret}
							String: {event[1].fingerTech?.string}
						</td>
					{/if}
				</tr>
			{/each}
		</tbody>
	</table>
</div>
