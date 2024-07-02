<script lang="ts">
	import { preferredMic, micList } from '$lib/mic';

	const preferredMicSvelteAdapter = {
		set(value: typeof preferredMic.value) {
			preferredMic.value = value;
		},
		subscribe: preferredMic.subscribe
	};
</script>

<div>
	<select bind:value={$preferredMicSvelteAdapter}>
		<option value={undefined}>Select a microphone</option>
		{#each $micList as mic}
			<option value={mic}>{mic.label}</option>
		{/each}
	</select>
</div>
<div>
	<span
		>Selected:
		{#if $preferredMic}
			{$preferredMic.label}
		{:else}
			None
		{/if}
	</span>
</div>
