<script lang="ts">
	import { preferredMic, micList } from '$lib/mic';
	// MediaDeviceInfo is a built-in type

	// Local state mirroring the store value
	let selectedMic = $state<MediaDeviceInfo | undefined>($preferredMic);

	// Effect to update the store when local state changes
	$effect(() => {
		preferredMic.set(selectedMic);
	});

	// Simpler effect to update local state if store changes elsewhere
	$effect(() => {
		selectedMic = $preferredMic;
	});
</script>

<div>
	<select bind:value={$preferredMic}>
		<option value={undefined}>Select a microphone</option>
		{#each $micList as mic}
			<option value={mic}>{mic.label}</option>
		{/each}
	</select>
</div>
<div>
	<span
		>Selected:
		{#if $preferredMic} {/* Revert to using store value */}
			{$preferredMic.label}
		{:else}
			None
		{/if}
	</span>
</div>
