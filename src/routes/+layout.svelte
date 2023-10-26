<script lang="ts">
	import { audioContextStarted } from '$lib/mic/audioContext';
	import { onMount } from 'svelte';
	import { AppShell } from '@skeletonlabs/skeleton';
	import { AppBar } from '@skeletonlabs/skeleton';
	import { AppRail, AppRailTile, AppRailAnchor } from '@skeletonlabs/skeleton';
	import '../app.postcss';
	import Logo from '../lib/components/Logo.svelte';
	let currentTile = 0;
	async function initializeTone() {
		await tone.start();
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

<AppShell>
	<svelte:fragment slot="header">
		<AppBar>
			<svelte:fragment slot="lead"></svelte:fragment>
			<div class="flex-1 gap-2">
				<a class="btn btn-ghost normal-case text-xl" href="/tuner">Tuner</a>
				<a class="btn btn-ghost normal-case text-xl" href="/game">Game</a>
				<a class="btn btn-ghost normal-case text-xl" href="/spectrogram">Spectrogram</a>
			</div>
			<svelte:fragment slot="trail">
				<div class="flex-none gap-2">
					<a href="/settings" class="w-full h-full absolute">⚙️</a>

					<!-- <div class="dropdown dropdown-end">
						<label tabindex="0" class="btn btn-ghost btn-circle avatar">
							<div class="w-10 rounded-full bg-white" />
						</label>
					</div> -->
				</div>
			</svelte:fragment>
		</AppBar>
		<div class="navbar"></div>
	</svelte:fragment>
	<svelte:fragment slot="sidebarLeft">
		<AppRail>
			<svelte:fragment slot="lead">
				<!-- <a class="btn btn-ghost normal-case text-xl" href="/">SStrings</a> -->
				<AppRailAnchor href="/" class="">
					<div class="p-1">
						<Logo />
					</div>
					<!-- <img src="/logo.svg" alt="SStrings" class="w-10 h-10" /> -->
				</AppRailAnchor>
			</svelte:fragment>
			<!-- --- -->
			<AppRailTile bind:group={currentTile} name="tile-1" value={0} title="tile-1">
				<svelte:fragment slot="lead">(icon)</svelte:fragment>
				<span>Tile 1</span>
			</AppRailTile>
			<AppRailTile bind:group={currentTile} name="tile-2" value={1} title="tile-2">
				<svelte:fragment slot="lead">(icon)</svelte:fragment>
				<span>Tile 2</span>
			</AppRailTile>
			<AppRailTile bind:group={currentTile} name="tile-3" value={2} title="tile-3">
				<svelte:fragment slot="lead">(icon)</svelte:fragment>
				<span>Tile 3</span>
			</AppRailTile>
			<!-- --- -->
			<svelte:fragment slot="trail">
				<AppRailAnchor href="/" target="_blank" title="Account">(icon)</AppRailAnchor>
			</svelte:fragment>
		</AppRail>
	</svelte:fragment>
	<!-- (sidebarRight) -->
	<!-- (pageHeader) -->
	<!-- Router Slot -->
	<slot />
	<!-- ---- / ---- -->
	<svelte:fragment slot="pageFooter">Page Footer</svelte:fragment>
	<!-- (footer) -->
</AppShell>
