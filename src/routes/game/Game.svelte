<script lang="ts">
	import { GRAY, STRING_COLORS } from '$lib/colors';
	import { OrbitControls } from '@threlte/extras';
	import { T } from '@threlte/core';
	import { SongClock } from '$lib/songParser/songclock';
	import { onMount } from 'svelte';
	import { Song } from '$lib/songParser/song';
	import type { MusicEvent, NotePlayEvent, SongPart } from '$lib/songParser/song';
	import score from '$lib/assets/music.xml?raw';
	import { Text } from '@threlte/extras';
	function degToRad(deg: number) {
		return (deg * Math.PI) / 180;
	}

	let position: [number, number, number] = [10, 10, 10];

	// 0 to 22 generator
	let frets = Array.from({ length: 23 }, (_, i) => i);

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

	let songClock: SongClock = new SongClock();
	let song: Song | null = null;
	let rawTimings: [number, MusicEvent][] = [];
	let part: SongPart | undefined;
	$: rawNotes = rawTimings.filter(([t, event]) => event.type === 'note_play') as [
		number,
		NotePlayEvent
	][];
	let songPlaybackTime = 0;
	onMount(async () => {
		song = new Song(score);
		part = song.part('P1');

		rawTimings = song.getPartMusicEventsRawTimed('P1');
		rawNotes = rawTimings.filter(([t, event]) => event.type === 'note_play') as [
			number,
			NotePlayEvent
		][];

		// 14.4
		console.log(song);

		songClock.setTimeline(song.getPartMusicEventsRawTimed('P1'));

		// songClock.addEventListener(({ time, event, remaining }) => {
		// 	songPlaybackTime = time;
		// });

		setInterval(() => {
			songPlaybackTime += 0.016;
		}, 16);

		songClock.start();
	});

	function fingeringPosition(fret: number, string: number): [number, number, number] {
		return [-(1 - fret_ratio(fret)) * 100, 6 - string, 0];
	}
</script>

<T.PerspectiveCamera makeDefault {position} fov={60}>
	<OrbitControls maxPolarAngle={degToRad(80)} enableZoom={true} target.y={6} target.x={10} />
</T.PerspectiveCamera>

<T.DirectionalLight castShadow position={[3, 10, -10]} />
<T.AmbientLight intensity={0.2} />

<!-- Strings -->
{#each STRING_COLORS as color, i}
	<T.Mesh rotation.z={degToRad(90)} position.y={6 - i}>
		<T.CapsuleGeometry args={[0.1, 30, 1, 9]} />
		<T.MeshStandardMaterial {color} />
	</T.Mesh>
{/each}

<!-- Frets -->
{#each frets as fret}
	<T.Mesh rotation.y={degToRad(90)} position.y={3.5} position.x={fret}>
		<T.CapsuleGeometry args={[0.1, 5, 6, 9]} />
		<T.MeshStandardMaterial color={GRAY} />
	</T.Mesh>

	<!-- Text -->
	<Text
		text={fret.toString()}
		position={[fret + 0.5, 3.5, 0.3]}
		fontSize={0.5}
		textAlign="center"
		fontWeight={900}
		characters={'0123456789'}
		sdfGlyphSize={64}
	/>
{/each}

<!-- Notes for now just make a line of rectangle notes in the z direction -->
{#each rawNotes as [t, event], i}
	<T.Mesh
		position.z={(-t + songPlaybackTime) * 50}
		position.y={event.fingerTech?.string ? event.fingerTech?.string ?? 0 : 10}
		position.x={event.fingerTech?.fret ? 0.5 + event.fingerTech?.fret ?? 0 : -1}
	>
		<T.BoxGeometry args={[event.fingerTech?.fret === 0 ? 10 : 1, 0.5, 0.4]} />
		<T.MeshStandardMaterial color={STRING_COLORS[6 - (event.fingerTech?.string ?? 0)]} />
	</T.Mesh>
{/each}

<T.Mesh rotation.y={degToRad(90)} position.y={3.5} position.x={0}>
	<T.CapsuleGeometry args={[0.2, 6, 7, 10]} />
	<T.MeshStandardMaterial color={[1, 1, 1]} />
</T.Mesh>

<!-- Print each measure start -->
{#if part}
	{#each part.measures as measure, i}
		{measure.time}
		<Text
			text={i.toString()}
			position.z={(-measure.time + songPlaybackTime) * 50}
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
