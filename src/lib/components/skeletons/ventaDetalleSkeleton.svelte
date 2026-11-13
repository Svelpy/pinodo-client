<script lang="ts">
	const block = 'bg-light-one_d dark:bg-dark-one_d';
	const card = 'border border-light-one_d bg-light-one dark:border-dark-one_d dark:bg-dark-one';
	const WIDTHS = ['w-1/2', 'w-2/3', 'w-2/5'];
</script>

<div role="status" aria-label="Cargando venta">
	<span class="sr-only">Cargando…</span>
	<div class="space-y-4" aria-hidden="true">
		<div class="flex animate-pulse flex-wrap gap-2">
			{#each { length: 4 }, i (i)}
				<div class={['h-11 w-32', block]}></div>
			{/each}
		</div>
		<div
			class="grid animate-pulse grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]"
		>
			<div class={card}>
				<div class="border-b border-light-one_d px-4 py-3 dark:border-dark-one_d">
					<div class={['h-4 w-24', block]}></div>
				</div>
				{#each { length: 3 }, i (i)}
					<div
						class="flex justify-between gap-3 border-b border-light-one_d px-4 py-3 dark:border-dark-one_d"
					>
						<div class="flex-1 space-y-2">
							<div class={['h-3.5', block, WIDTHS[i % WIDTHS.length]]}></div>
							<div class={['h-3 w-1/3', block]}></div>
						</div>
						<div class={['h-4 w-20', block]}></div>
					</div>
				{/each}
				<div class="flex justify-between px-4 py-4">
					<div class={['h-4 w-16', block]}></div>
					<div class={['h-7 w-28', block]}></div>
				</div>
			</div>
			<div class="space-y-4">
				<div class="{card} space-y-3 p-4">
					<div class={['h-5 w-24', block]}></div>
					{#each { length: 4 }, i (i)}
						<div class="flex justify-between">
							<div class={['h-3.5 w-24', block]}></div>
							<div class={['h-3.5 w-28', block]}></div>
						</div>
					{/each}
				</div>
				<div class="{card} space-y-3 p-4">
					{#each { length: 2 }, i (i)}
						<div class="flex justify-between">
							<div class={['h-3.5 w-20', block]}></div>
							<div class={['h-3.5 w-32', block]}></div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>
