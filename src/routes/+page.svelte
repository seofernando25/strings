<script lang="ts">
	import score from '$lib/assets/music.xml?raw';
	import { Song, pitchToString, type MusicEvent } from '$lib/songParser/song';
	import { onDestroy, onMount } from 'svelte';
	import { audioContextStarted } from '$lib/mic/audioContext';
	import * as Tone from 'tone';
	import { browser } from '$app/environment';
	import { tweened } from 'svelte/motion';

	let synth: Tone.PolySynth | null = null;
	let song: Song | null = null;
	onMount(async () => {
		song = new Song(score);
		if (crossOriginIsolated) {
			console.log('crossOriginIsolated');
		} else {
			console.log('not crossOriginIsolated');
		}

		const part = song.part('P1');
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

	let songPlayback: Tone.ToneEvent | null = null;
	$: songPlaybackTimeDisplay = tweened(0, {
		duration: 50,
		easing: (t) => t * t
	});

	let times: { note: number; eventT: any }[] = [];
	$: selected = 'P1';
	$: songPart = song?.part(selected);
	async function playSong() {
		let measuresArr = songPart?.measures ?? [];

		let allEvents: MusicEvent[] = measuresArr.flatMap((m) => m.events);
		Tone.Transport.loop = false;
		songPlayback = new Tone.ToneEvent((time, ev) => {
			for (const musicEvent of ev) {
				let baseT = musicEvent.measure.time + musicEvent.time;
				Tone.Draw.schedule(function () {
					songPlaybackTimeDisplay.set(baseT);
				}, baseT);

				if (musicEvent.type === 'rest') {
					//
				} else if (musicEvent.type === 'signature_change') {
					// Tone.Transport.timeSignature = [musicEvent.nBeats, musicEvent.beatType];
				} else if (musicEvent.type === 'tempo_change') {
					Tone.Transport.bpm.setValueAtTime(musicEvent.bpm, baseT);
				} else if (musicEvent.type === 'note_play') {
					const duration = musicEvent.duration;
					const pitch = pitchToString(musicEvent.pitch);
					synth?.triggerAttackRelease(pitch, duration, baseT);
				}
			}
		}, allEvents);

		songPlayback.start();
		console.log('Done Scheduling music');
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

	function setPlaybackTime(desiredPlaybackTime: number) {
		if (!songPlayback) {
			return;
		}
		console.log('setPlaybackTime');
		songPlayback.start(desiredPlaybackTime);
	}
</script>

{#if song}
	<header class="bg-gray-800 text-white py-4 px-8 flex justify-between items-center">
		<h1 class="text-2xl font-bold">{song?.title()} by {song?.artist()}</h1>
		{#if song?.partsInfo().length > 0}
			<select bind:value={selected} class="select select-bordered w-full max-w-xs ml-4">
				{#each song?.partsInfo() as part}
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
