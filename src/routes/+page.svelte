<script lang="ts">
	import score from '$lib/assets/music.xml?raw';
	import {
		Song,
		type MusicEvent,
		getSongPartEventRawTimed,
		playSongPart
	} from '$lib/songParser/song';
	import { onDestroy, onMount } from 'svelte';
	import { audioContextStarted } from '$lib/mic/audioContext';
	import * as Tone from 'tone';
	import { browser } from '$app/environment';
	import { tweened } from 'svelte/motion';
	import { cubicIn } from 'svelte/easing';
	import { SongClock } from '$lib/songParser/songclock';
	import type { SongPart } from '$lib/songParser/song';

	let synth: Tone.PolySynth | null = null;
	let song: Song | null = null;

	let timed = $state([] as [number, MusicEvent][]);
	let songClock: SongClock = new SongClock();
	let songPlaybackTime = $state(0);
	onMount(async () => {
		song = new Song(score);
		songClock.setTimeline(getSongPartEventRawTimed(song.parts.find((part) => part.id === 'P1')!));

		songClock.addEventListener(({ time, event, remaining }) => {
			songPlaybackTime = time;
			timed = remaining;
		});

		setInterval(() => {
			songPlaybackTime += songClock?.getDelta() ?? 0;
		}, 10);

		audioContextStarted.subscribe((started) => {
			console.log('Audio Context Changed');

			console.log(started);
			if (started) {
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
	});

	const songPlaybackTimeDisplay = tweened(0, {
		duration: 50,
		easing: cubicIn
	});

	$effect(() => {
		songPlaybackTimeDisplay.set(songPlaybackTime);
	});

	let times: { note: number; eventT: any }[] = [];
	let selected = $state('P1');
	const songPart: SongPart | null = $derived(() => {
		if (song && song.parts) {
			const part = song.parts.find((p) => p.id === selected);
			return part || null;
		}
		return null;
	});
	async function playSong() {
		if (!songPart) {
			return;
		}
		playSongPart(songPart);
	}

	let isPlaying = $state(false);
	function togglePlayback() {
		if (isPlaying) {
			Tone.Transport.pause();
			Tone.Transport.stop(0);
		} else {
			Tone.Transport.start();
		}

		isPlaying = !isPlaying;
	}

	onDestroy(() => {
		if (browser) {
			console.log('destroyed');
		}
	});
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
		<button onclick={playSong} class="btn btn-primary w-full">Play Song</button>
		<button onclick={togglePlayback} class="btn btn-primary w-full">
			{isPlaying ? 'Click to Pause' : 'Click to Play'}
		</button>

		<div class="flex items-center gap-4">
			<div class="w-10">{$songPlaybackTimeDisplay.toFixed(2)}</div>
			<input
				type="range"
				min="0"
				max="150"
				step="0.01"
				bind:value={songPlaybackTime}
				class="range w-full"
			/>
		</div>
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
<div class="overflow-x-auto">
	<table class="table">
		<thead>
			<tr>
				<th></th>
				<th>Time</th>
				<th>Type</th>
				<th></th>
				<th></th>
				<th></th>
			</tr>
		</thead>
		<tbody>
			{#each timed as event, i}
				<tr>
					<th>{i}</th>
					<td>{event[0]}</td>
					<td>{event[1].type}</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
