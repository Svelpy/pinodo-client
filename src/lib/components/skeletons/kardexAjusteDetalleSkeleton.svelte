<script lang="ts">
	const block = 'bg-light-one_d dark:bg-dark-one_d';
	const card = 'border border-light-one_d bg-light-one dark:border-dark-one_d dark:bg-dark-one';
	const WIDTHS = ['w-1/2', 'w-2/3', 'w-2/5'];
</script>

<!-- Mismo layout que KardexAjusteDetalle: totales, datos y líneas -->
<div role="status" aria-label="Cargando ajuste">
	<span class="sr-only">Cargando…</span>
	<div class="animate-pulse space-y-4" aria-hidden="true">
		<div class="grid grid-cols-2 gap-3 md:grid-cols-3">
			{#each { length: 3 }, i (i)}
				<div class={[card, 'space-y-3 p-4', i === 2 && 'col-span-2 md:col-span-1']}>
					<div class="flex items-center gap-2">
						<div class={['size-8', block]}></div>
						<div class={['h-3.5 w-16', block]}></div>
					</div>
					<div class={['h-7 w-24', block]}></div>
					<div class={['h-3 w-32', block]}></div>
				</div>
			{/each}
		</div>

		<div class={[card, 'grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4']}>
			{#each { length: 4 }, i (i)}
				<div class="space-y-1.5">
					<div class={['h-3 w-16', block]}></div>
					<div class={['h-4 w-28', block]}></div>
				</div>
			{/each}
		</div>

		<div class={card}>
			<div class="border-b border-light-one_d px-4 py-3 dark:border-dark-one_d">
				<div class={['h-4 w-20', block]}></div>
			</div>
			{#each { length: 3 }, i (i)}
				<div
					class="flex justify-between gap-3 border-b border-light-one_d px-4 py-3 last:border-b-0 dark:border-dark-one_d"
				>
					<div class="flex-1 space-y-2">
						<div class={['h-3.5', block, WIDTHS[i % WIDTHS.length]]}></div>
						<div class={['h-3 w-1/3', block]}></div>
					</div>
					<div class={['h-4 w-20', block]}></div>
				</div>
			{/each}
		</div>
	</div>
</div>
