<script lang="ts">
	import { Canvas } from '@threlte/core';
	import Game from './Game.svelte';
	import { Song } from '$lib/songParser/song';
	import score from '$lib/assets/music.xml?raw';
	import { browser } from '@tensorflow/tfjs';

	let song: Song = new Song(score);
	let partId: string = 'P1';
	$: songPart = song.parts.find((part) => part.id === partId)!;

	console.log(song);
</script>

<header class="bg-gray-800 text-white py-4 px-8 flex justify-between items-center">
	<h1 class="text-2xl font-bold">{song?.title} by {song?.artist}</h1>
	{#if song}
		{#if song.parts ?? 0 > 0}
			<select bind:value={partId} class="select select-bordered w-full max-w-xs ml-4">
				{#each song.parts as part}
					<option value={part.id}>{part.name}</option>
				{/each}
			</select>
		{/if}
	{/if}
</header>
<div class="flex-1">
	{#if browser && song}
		<Canvas>
			<Game {songPart}></Game>
		</Canvas>
	{/if}
</div>
