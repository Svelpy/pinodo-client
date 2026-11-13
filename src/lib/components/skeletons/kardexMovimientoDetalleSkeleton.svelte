<script lang="ts">
	const block = 'bg-light-one_d dark:bg-dark-one_d';
	const card = 'border border-light-one_d bg-light-one dark:border-dark-one_d dark:bg-dark-one';
</script>

<!-- Mismo layout que KardexMovimientoDetalle: prenda, seis valores y origen -->
<div role="status" aria-label="Cargando movimiento">
	<span class="sr-only">Cargando…</span>
	<div class="animate-pulse space-y-4" aria-hidden="true">
		<div class={[card, 'flex justify-between gap-3 p-4']}>
			<div class="space-y-2">
				<div class={['h-4 w-48', block]}></div>
				<div class={['h-3 w-32', block]}></div>
			</div>
			<div class={['h-6 w-16', block]}></div>
		</div>

		<div class="grid grid-cols-2 gap-3 md:grid-cols-3">
			{#each { length: 6 }, i (i)}
				<div class={[card, 'space-y-3 p-4']}>
					<div class={['h-3.5 w-20', block]}></div>
					<div class={['h-7 w-24', block]}></div>
					<div class={['h-3 w-28', block]}></div>
				</div>
			{/each}
		</div>

		<div class={[card, 'grid gap-4 p-4 sm:grid-cols-3']}>
			{#each { length: 3 }, i (i)}
				<div class="space-y-1.5">
					<div class={['h-3 w-16', block]}></div>
					<div class={['h-4 w-32', block]}></div>
				</div>
			{/each}
		</div>
	</div>
</div>
