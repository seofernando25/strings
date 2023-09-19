<script lang="ts">
	import * as Tone from 'tone';
	import score from '$lib/assets/lucky.xml?raw';
	import { Song, type TimeMeasure } from '$lib/song';
	import { onMount } from 'svelte';
	import { audioContextStarted } from '$lib/mic/audioContext';

	let synth: Tone.PolySynth | null = null;

	const song = new Song(score);
	onMount(async () => {
		const part = song.part('P1');
		console.log(part);
		audioContextStarted.subscribe((started) => {
			console.log('Audio Context Changed');

			console.log(started);
			if (started) {
				synth = new Tone.PolySynth(Tone.Synth, {
					detune: 100
				}).toDestination();
			}
		});
	});

	let times: { note: number; eventT: number }[] = [];
	$: selected = 'P1';
	async function playSong() {
		times = [];

		const part = song.part(selected);

		if (part === undefined) return;
		const start = Tone.now();
		let elapsed = Tone.now();
		Tone.Transport.timeSignature = [4, 4];
		const cmds: [number, number, number][] = [];
		let timeSignature: TimeMeasure = {
			beats: 4,
			beatType: 4
		};
		let tempo = 120;
		for (const measure of part.measures) {
			if (measure.timeMeasure) {
				timeSignature = measure.timeMeasure;
			}
			if (measure.tempo) {
				tempo = measure.tempo;
			}
			// First not of a chord doesn't actually is note.isChord
			const bps = 60 / tempo;
			for (const note of measure.notes) {
				const wholeNoteDuration = bps * timeSignature.beatType;
				const noteDuration = wholeNoteDuration / (note.duration * timeSignature.beatType);

				if (!note.isChord) {
					elapsed = elapsed + noteDuration;
				}
				if (!note.isRest) {
					times.push({
						note: note.noteFreq,
						eventT: elapsed - start
					});
					cmds.push([note.noteFreq, noteDuration / 0.9, elapsed]);
				} else {
					times.push({
						note: 0,
						eventT: elapsed - start
					});
				}
			}
			times.push({
				note: 0,
				eventT: 0
			});
		}

		// synth?.triggerAttackRelease([note.noteFreq], noteDuration / 2, elapsed);
		// Aggregating notes that are played at the same time (have the same elapsed time)
		const aggregated = new Map<number, [number[], number, number]>();
		for (const cmd of cmds) {
			const [note, duration, startT] = cmd;
			if (aggregated.has(startT)) {
				const command = aggregated.get(startT)!;
				command[0].push(note);
				aggregated.set(startT, command);
			} else {
				aggregated.set(startT, [[note], duration, startT]);
			}
		}

		for (const cmd of aggregated.values()) {
			const [notes, duration, startT] = cmd;
			synth?.triggerAttackRelease(notes, duration, startT);
		}

		Tone.Transport.start();
		times = times;

		console.log('Done Scheduling music');
	}
</script>

<button on:click={playSong} class="btn">Play Song</button>

{#if song.partsInfo().length > 0}
	<select bind:value={selected} class="select select-bordered w-full max-w-xs">
		{#each song.partsInfo() as part}
			<option value={part.id}>{part.name}</option>
		{/each}
	</select>
{/if}

<div class="flex flex-col gap-2">
	{#each times as { note, eventT }}
		<div class="flex gap-2">
			<div class="w-10">{note}</div>
			<div class="w-10">{eventT}</div>
		</div>
	{/each}
</div>
