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
	import { SongClock } from '$lib/songParser/songclock';

	let synth: Tone.PolySynth | null = null;
	let song: Song | null = null;

	$: timed = [] as [number, MusicEvent][];
	let songClock: SongClock = new SongClock();
	// Only show events that have happened after the current time slice 10
	$: songPlaybackTime = 0;
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

	$: songPlaybackTimeDisplay = tweened(0, {
		duration: 50,
		easing: (t) => t * t
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
		<button on:click={playSong} class="btn btn-primary w-full">Play Song</button>
		<button on:click={togglePlayback} class="btn btn-primary w-full">
			{isPlaying ? 'Click to Pause' : 'Click to Play'}
		</button>

		<!-- Slider -->
		<!-- content here -->
		<div class="flex items-center gap-4">
			<div class="w-10">{$songPlaybackTimeDisplay.toFixed(2)}</div>
			<input
				type="range"
				min="0"
				max="150"
				step="0.01"
				bind:value={$songPlaybackTimeDisplay}
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
<!-- timed -->
<div class="overflow-x-auto">
	<table class="table">
		<!-- head -->
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
