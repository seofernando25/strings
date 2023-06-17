<script lang="ts">
	import { GRAY, STRING_COLORS } from '$lib/colors';
	import { Canvas, OrbitControls, T } from '@threlte/core';
	import { degToRad } from 'three/src/math/MathUtils';

	let position: [number, number, number] = [-0.5, 6, -10];

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

	console.log(fret_ratio(0));
</script>

<div class="h-screen">
	<Canvas>
		<T.PerspectiveCamera makeDefault {position} fov={60}>
			<OrbitControls maxPolarAngle={degToRad(80)} enableZoom={true} target={{ y: 6 }} />
		</T.PerspectiveCamera>

		<T.DirectionalLight castShadow position={[3, 10, -10]} />
		<T.AmbientLight intensity={0.2} />

		<!-- Strings -->
		{#each STRING_COLORS as color, i}
			<T.Mesh receiveShadow rotation.z={degToRad(90)} position.y={6 - i}>
				<T.CapsuleGeometry args={[0.1, 30, 1, 9]} />
				<T.MeshStandardMaterial {color} />
			</T.Mesh>
		{/each}

		<!-- Frets -->
		{#each frets as fret}
			<T.Mesh
				receiveShadow
				rotation.y={degToRad(90)}
				position.y={3.5}
				position.x={-(1 - fret_ratio(fret)) * 100}
			>
				<T.CapsuleGeometry args={[0.1, 5, 6, 9]} />
				<T.MeshStandardMaterial color={GRAY} />
			</T.Mesh>
		{/each}
	</Canvas>
</div>
