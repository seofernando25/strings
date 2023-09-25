<script lang="ts">
	import { Canvas } from '@threlte/core';
	import Game from './Game.svelte';
	import { SongClock } from '$lib/songParser/songclock';
</script>

<div class="h-screen">
	<Canvas>
		<Game></Game>
	</Canvas>
</div>
