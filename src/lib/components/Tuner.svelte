<script lang="ts">
	export let expected = 440;
	export let viewMargin = 30;
	export let value = 20;
	export let errorMargin = 2;

	$: rightView = expected + viewMargin;
	$: leftView = expected - viewMargin;
	$: middle = (rightView + leftView) / 2;

	$: valuePercent = ((value - leftView) / (rightView - leftView)) * 100;
	$: valuePercentClamped = Math.min(Math.max(valuePercent, 0), 100);

	// If value left to middle turn up, else down
</script>

<div class="bg-primary text-primary-content rounded p-2">
	<div class="h-2 bg-gray-200 rounded-full relative overflow-x">
		<!-- Red dot in center -->
		<div
			class=" w-2 h-full bg-red-500 rounded-full absolute top-0"
			style="left: {50}%;
        transform: translateX(-50%);
        "
		/>
		<div
			class="mt-1 rounded absolute top-2"
			style="left: {50}%;
        transform: translateX(-50%);
        "
		>
			{middle}
		</div>

		<!-- Value is a blue dot -->
		<div
			class=" w-2 h-full bg-blue-500 rounded-full absolute top-0"
			style="left: {valuePercentClamped}%;
        transform: translateX(-50%);
        "
		/>
		<!-- Value label right under -->
		<div
			class="bg-blue-300 mt-1 text-center rounded absolute top-2"
			style="left: {valuePercentClamped}%;
        transform: translateX(-50%);
        "
		>
			{value.toFixed(2)} <br />
			{#if Math.abs(value - middle) > errorMargin}
				{#if value < middle}
					<span class="text-xs">Turn up</span>
				{:else}
					<span class="text-xs">Turn down</span>
				{/if}
			{/if}
		</div>
	</div>

	<!-- Labels -->
	<div class="flex justify-between text-center">
		<span>{leftView}</span>
		<span>{rightView}</span>
	</div>
</div>
