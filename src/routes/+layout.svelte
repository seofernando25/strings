<script lang="ts">
	import { audioContextStarted } from '$lib/mic/audioContext';
	import { onMount } from 'svelte';
	import '../app.postcss';
	import * as Tone from 'tone';

	async function initializeTone() {
		await Tone.start();
		audioContextStarted.set(true);
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Tab' && !event.shiftKey) {
			event.preventDefault();
		}
	}

	let tone: typeof import('tone');
	onMount(async () => {
		tone = await import('tone');
	});
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

<div class="w-full h-screen">
	<div class="navbar">
		<div class="flex-1 gap-2">
			<a class="btn btn-ghost normal-case text-xl" href="/">SStrings</a>
			<a class="btn btn-ghost normal-case text-xl" href="/tuner">Tuner</a>
			<a class="btn btn-ghost normal-case text-xl" href="/game">Game</a>
		</div>
		<div class="flex-none gap-2">
			<a href="/settings" class="btn btn-outline">⚙️</a>

			<!-- svelte-ignore a11y-label-has-associated-control -->
			<div class="dropdown dropdown-end">
				<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
				<label tabindex="0" class="btn btn-ghost btn-circle avatar">
					<div class="w-10 rounded-full bg-white" />
				</label>
				<!-- <ul
					tabindex="0"
					class="menu menu-sm dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52"
				>
					<li>
						<a class="justify-between">
							Profile
							<span class="badge">New</span>
						</a>
					</li>
					<li><a>Settings</a></li>
					<li><a>Logout</a></li>
				</ul> -->
			</div>
		</div>
	</div>

	<slot />
</div>
