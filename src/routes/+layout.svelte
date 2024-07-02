<script lang="ts">
	import { audioContextStarted } from '$lib/mic/audioContext';
	import * as Tone from 'tone';
	import '../app.postcss';
	async function initializeTone() {
		await Tone.start();
		audioContextStarted.value = true;
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Tab' && !event.shiftKey) {
			event.preventDefault();
		}
	}
</script>

{#if !$audioContextStarted}
	<button
		class="z-50 fixed inset-0 flex items-center justify-center text-4xl md:text-6xl lg:text-7xl text-center font-bold text-white bg-gray-900 bg-opacity-70"
		on:click={initializeTone}
		on:keydown={handleKeyDown}
	>
		Click anywhere to start AudioContext
	</button>
{/if}

<div class="h-screen flex flex-col">
	<header class="ps-4 pe-4 flex items-center place-content-between">
		<div class="gap-2">
			<a class="btn btn-ghost normal-case text-xl" href="/tuner">Tuner</a>
			<a class="btn btn-ghost normal-case text-xl" href="/game">Game</a>
			<a class="btn btn-ghost normal-case text-xl" href="/spectrogram">Spectrogram</a>
		</div>

		<div class="flex-none gap-2">
			<a href="/settings">⚙️</a>
		</div>
	</header>
	<slot></slot>
</div>
