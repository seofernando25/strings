<script lang="ts">
	import { GRAY, STRING_COLORS } from '$lib/colors';
	import { OrbitControls } from '@threlte/extras';
	import { T } from '@threlte/core';
	import { SongClock } from '$lib/songParser/songclock';
	import { onMount } from 'svelte';
	import { Song } from '$lib/songParser/song';
	import type { MusicEvent, NotePlayEvent } from '$lib/songParser/song';
	import score from '$lib/assets/trap.xml?raw';

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
	$: rawNotes = rawTimings.filter(([t, event]) => event.type === 'note_play') as [
		number,
		NotePlayEvent
	][];
	let songPlaybackTime = 0;
	let timed = [] as [number, MusicEvent][];
	onMount(async () => {
		song = new Song(score);
		rawTimings = song.getPartMusicEventsRawTimed('P1');
		songClock.setTimeline(rawTimings);
		const notes = rawTimings.filter(([t, event]) => event.type === 'note_play') as [
			number,
			NotePlayEvent
		][];
		const notesWithoutFingerTech = notes.filter(([t, event]) => !event.fingerTech);
		console.log(notesWithoutFingerTech);

		// songClock.setTimeline(song.getPartMusicEventsRawTimed('P1'));

		// songClock.addEventListener(({ time, event, remaining }) => {
		// 	songPlaybackTime = time;
		// 	timed = remaining;
		// });

		setInterval(() => {
			songPlaybackTime += 0.06;
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
{/each}

<!-- Notes for now just make a line of rectangle notes in the z direction -->
{#each rawNotes as [t, event], i}
	<T.Mesh
		position.z={-t + songPlaybackTime}
		position.y={event.fingerTech?.string ? 6 - (event.fingerTech?.string ?? 0) : 10}
		position.x={event.fingerTech?.fret ? event.fingerTech?.fret ?? 0 : -1}
	>
		<T.BoxGeometry args={[1, 0.5, 0.4]} />
		<T.MeshStandardMaterial color={STRING_COLORS[event.fingerTech?.string ?? 0]} />
	</T.Mesh>
{/each}

<T.Mesh rotation.y={degToRad(90)} position.y={3.5} position.x={0}>
	<T.CapsuleGeometry args={[0.2, 6, 7, 10]} />
	<T.MeshStandardMaterial color={[1, 1, 1]} />
</T.Mesh>
