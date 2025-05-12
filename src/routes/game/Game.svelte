<script lang="ts">
	import { GRAY, STRING_COLORS } from '$lib/colors';
	import { OrbitControls } from '@threlte/extras';
	import { T } from '@threlte/core';
	import { onMount } from 'svelte';
	import {
		getSongPartEventRawTimed,
		type MusicEvent,
		type NotePlayEvent,
		type SongPart
	} from '$lib/songParser/song';

	import audioFile from '$lib/assets/music.m4a?url';
	import { Text } from '@threlte/extras';
	import { tweened } from 'svelte/motion';

	// Runes are global

	let { songPart } = $props<{ songPart: SongPart }>();

	function degToRad(deg: number) {
		return (deg * Math.PI) / 180;
	}

	const frets = Array.from({ length: 26 }, (_, i) => i).filter((i) => i !== 0);
	const guitarScale = 50;
	const noteSpeed = 50;

	/**
	 * Returns guitar fret ratios
	 * eg:
	 * 0: 1/1
	 * 1: 2.82842712475/3
	 * 2: 8/9
	 * 12: 1/2
	 * @param fretNum
	 */
	function fret_ratio(fretNum: number): number {
		return Math.pow(Math.sqrt(8) / 3, fretNum);
	}

	function fret_position(fretNum: number): number {
		return (1 - fret_ratio(fretNum)) * guitarScale;
	}

	let rawTimings: [number, MusicEvent][] = [];
	let rawNotes: [number, NotePlayEvent][] = [];
	let songPlaybackTime = $state(0);
	let player = $state<HTMLAudioElement | null>(null);
	let closestNoteIdx = $state(0);

	const averageNoteX = $derived(
		rawNotes.slice(closestNoteIdx, closestNoteIdx + 10).reduce((acc, [t, event]) => {
			const fret = event.fingerTech?.fret ?? 0;
			if (fret === 0) {
				return acc;
			}
			return acc + (fret ? fret_position(0.5 + fret) ?? 0 : -1);
		}, 0) / 10
	);

	const tweenedXPos = tweened(0, {
		duration: 250
	});

	$effect(() => {
		tweenedXPos.set(averageNoteX);
	});

	onMount(async () => {
		player?.play();
		rawTimings = getSongPartEventRawTimed(songPart);
		rawNotes = rawTimings.filter(([t, event]) => event.type === 'note_play') as [
			number,
			NotePlayEvent
		][];

		console.log(rawNotes);

		setInterval(() => {
			songPlaybackTime = 1.9 + (player?.currentTime ?? 0);
			if (closestNoteIdx < rawNotes.length && songPlaybackTime > rawNotes[closestNoteIdx][0]) {
				closestNoteIdx++;
			}
		}, 16);
	});
</script>

<audio src={audioFile} bind:this={player}> </audio>

<T.PerspectiveCamera makeDefault position.x={$tweenedXPos} position.y={10} position.z={30} fov={60}>
	<OrbitControls
		maxPolarAngle={degToRad(80)}
		enableZoom={true}
		target.y={10}
		target.x={$tweenedXPos}
		target.z={1}
		minDistance={15}
		maxDistance={15}
		oncreate={(event: any) => {
			event.ref.update(0);
		}}
	/>
</T.PerspectiveCamera>

<T.DirectionalLight castShadow position={[3, 10, -10]} />
<T.AmbientLight intensity={1} />

<!-- Strings -->
{#each STRING_COLORS as color, i}
	{@const w = 40}
	<T.Mesh rotation.z={degToRad(90)} position.y={6 - i} position.x={w / 2 + 1}>
		<T.CapsuleGeometry args={[0.1, w, 1, 9]} />
		<T.MeshStandardMaterial {color} />
	</T.Mesh>
{/each}

<!-- Frets -->
{#each frets as fret}
	<T.Mesh
		rotation.y={degToRad(90)}
		position.y={3.5}
		position.x={(1 - fret_ratio(fret)) * guitarScale}
	>
		<T.CapsuleGeometry args={[0.1, 5, 6, 9]} />
		<T.MeshStandardMaterial color={GRAY} />
	</T.Mesh>

	<!-- Text -->
	<Text
		text={fret.toString()}
		position={[fret + 0.5, 1, 0.3]}
		fontSize={0.5}
		textAlign="center"
		fontWeight={900}
		characters={'0123456789'}
		sdfGlyphSize={64}
	/>
{/each}

<!-- Fret dots markers -->
{#each [3, 5, 7, 9, 12, 15, 17, 19, 21, 24] as fret}
	{#if fret % 12 === 0}
		<T.Mesh
			rotation.y={degToRad(90)}
			position.y={5.5}
			position.x={(1 - fret_ratio(fret + 0.5)) * guitarScale}
		>
			<T.SphereGeometry args={[0.2, 6, 6]} />
			<T.MeshStandardMaterial color={[1, 1, 1]} />
		</T.Mesh>
		<T.Mesh
			rotation.y={degToRad(90)}
			position.y={1.5}
			position.x={(1 - fret_ratio(fret + 0.5)) * guitarScale}
		>
			<T.SphereGeometry args={[0.2, 6, 6]} />
			<T.MeshStandardMaterial color={[1, 1, 1]} />
		</T.Mesh>
	{:else}
		<T.Mesh
			rotation.y={degToRad(90)}
			position.y={3.5}
			position.x={(1 - fret_ratio(fret + 0.5)) * guitarScale}
		>
			<T.SphereGeometry args={[0.2, 6, 6]} />
			<T.MeshStandardMaterial color={[1, 1, 1]} />
		</T.Mesh>
	{/if}
{/each}

<!-- Notes for now just make a line of rectangle notes in the z direction -->
{#each rawNotes as [t, event], i}
	{#if event.fingerTech?.fret === 0}
		<T.Mesh
			position.z={(-t + songPlaybackTime) * noteSpeed}
			position.y={event.fingerTech && event.fingerTech.string !== undefined && event.fingerTech.string !== null ? event.fingerTech.string : 10}
			position.x={guitarScale / 2}
		>
			<T.BoxGeometry args={[guitarScale, 0.5, 0.4]} />
			<T.MeshStandardMaterial color={STRING_COLORS[6 - (event.fingerTech?.string ?? 0)]} />
		</T.Mesh>
	{:else}
		<T.Mesh
			position.z={(-t + songPlaybackTime) * noteSpeed}
			position.y={event.fingerTech && event.fingerTech.string !== undefined && event.fingerTech.string !== null ? event.fingerTech.string : 10}
			position.x={event.fingerTech?.fret
				? event.duration + fret_position(0.5 + event.fingerTech?.fret) ?? 0
				: -1}
		>
			<T.BoxGeometry args={[1, 0.5, event.duration]} />
			<T.MeshStandardMaterial color={STRING_COLORS[6 - (event.fingerTech?.string ?? 0)]} />
		</T.Mesh>
	{/if}
{/each}

<T.Mesh rotation.y={degToRad(90)} position.y={3.5} position.x={1}>
	<T.CapsuleGeometry args={[0.2, 6, 7, 10]} />
	<T.MeshStandardMaterial color={[1, 1, 1]} />
</T.Mesh>

<!-- Print each measure start -->
{#if songPart}
	{#each songPart.measures as measure, i}
		{measure.time}
		<Text
			text={i.toString()}
			position.z={(-measure.time + songPlaybackTime) * noteSpeed}
			position.y={5}
			position.x={0}
			fontSize={0.5}
			textAlign="center"
			fontWeight={900}
			characters={'0123456789'}
			sdfGlyphSize={64}
		/>
	{/each}
{/if}
