<script lang="ts">
	import { Canvas } from '@threlte/core';
	import Game from './Game.svelte';
	import { Song, type SongPart } from '$lib/songParser/song';
	import score from '$lib/assets/music.xml?raw';
	import { browser } from '$app/environment';

	let song: Song = new Song(score);
	let partId = $state('P1');
	const songPart: SongPart | null = $derived(() => {
		if (song && song.parts) {
			return song.parts.find((part) => part.id === partId) || null;
		}
		return null;
	});

	console.log(song);
</script>

<header class="bg-gray-800 text-white py-4 px-8 flex justify-between items-center">
	<h1 class="text-2xl font-bold">{song.title} by {song.artist}</h1>
	{#if song}
		{#if song.parts && song.parts.length > 0}
			<select bind:value={partId} class="select select-bordered w-full max-w-xs ml-4">
				{#each song.parts as part}
					<option value={part.id}>{part.name}</option>
				{/each}
			</select>
		{/if}
	{/if}
</header>
<div class="flex-1">
	{#if browser && song && songPart}
		<Canvas>
			<Game {songPart}></Game>
		</Canvas>
	{/if}
</div>
