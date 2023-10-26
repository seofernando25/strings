<!-- Squircle -->
<div
	class="grid place-content-center aspect-square w-full h-full bg-primary-backdrop-token rounded-[25%]"
>
	<div class="aspect-square w-8 w-8 pick bg-primary-500"></div>
</div>

<style>
	.pick {
		--roundness: 80%;
		border-top-left-radius: var(--roundness);
		border-top-right-radius: var(--roundness) 100%;
		border-bottom-right-radius: 5px;
		border-bottom-left-radius: 100% var(--roundness);

		transform: rotate(45deg);
	}
</style>
