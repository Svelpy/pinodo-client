<script lang="ts">
	interface Props {
		/** Cantidad de productos a mostrar */
		items?: number;
	}

	let { items = 4 }: Props = $props();

	const NAME_WIDTHS = ['w-1/2', 'w-2/3', 'w-2/5', 'w-3/5'];
	const block = 'bg-light-one_d dark:bg-dark-one_d';
</script>

<div role="status" aria-label="Cargando productos">
	<span class="sr-only">Cargando…</span>
	<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2" aria-hidden="true">
		{#each { length: items }, i (i)}
			<div
				class="animate-pulse border border-light-one_d bg-light-one dark:border-dark-one_d dark:bg-dark-one"
			>
				<div class="border-b border-light-one_d px-3 py-3 dark:border-dark-one_d">
					<div class={['h-4', block, NAME_WIDTHS[i % NAME_WIDTHS.length]]}></div>
				</div>
				<div class="space-y-2 px-3 py-3">
					<div class={['h-3 w-24', block]}></div>
					<div class="grid grid-cols-[repeat(auto-fill,minmax(5.25rem,1fr))] gap-1.5">
						{#each { length: 4 }, j (j)}
							<div class={['h-16', block]}></div>
						{/each}
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>
