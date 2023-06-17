<script>
	import '../app.postcss';
</script>

<div class="w-full h-screen">
	<div class="navbar">
		<div class="flex-1 gap-2">
			<a class="btn btn-ghost normal-case text-xl" href="/">SStrings</a>
			<a class="btn btn-ghost normal-case text-xl" href="/tuner">Tuner</a>
		</div>
		<div class="flex-none gap-2">
			<a href="/settings" class="btn btn-outline">⚙️</a>

			<!-- svelte-ignore a11y-label-has-associated-control -->
			<div class="dropdown dropdown-end">
				<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
				<label tabindex="0" class="btn btn-ghost btn-circle avatar">
					<div class="w-10 rounded-full bg-white" />
				</label>
				<!-- <ul
					tabindex="0"
					class="menu menu-sm dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52"
				>
					<li>
						<a class="justify-between">
							Profile
							<span class="badge">New</span>
						</a>
					</li>
					<li><a>Settings</a></li>
					<li><a>Logout</a></li>
				</ul> -->
			</div>
		</div>
	</div>

	<slot />
</div>
