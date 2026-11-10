<script lang="ts">
	// Misma forma que la caja: buscador y carrito a la izquierda, cobro a la derecha (escritorio)
	const block = 'bg-light-one_d dark:bg-dark-one_d';
	const card = 'border border-light-one_d bg-light-one dark:border-dark-one_d dark:bg-dark-one';
</script>

<div role="status" aria-label="Cargando la caja">
	<span class="sr-only">Cargando…</span>
	<div
		class="animate-pulse lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-6 2xl:grid-cols-[minmax(0,1fr)_28rem]"
		aria-hidden="true"
	>
		<div class="space-y-3">
			<div class="flex gap-2">
				<div class={['h-12 flex-1', block]}></div>
				<div class={['h-12 w-12 sm:w-32', block]}></div>
			</div>
			<div class={['h-5 w-56', block]}></div>
			<div class={card}>
				<div class="border-b border-light-one_d px-4 py-3 dark:border-dark-one_d">
					<div class={['h-5 w-32', block]}></div>
				</div>
				{#each { length: 3 }, i (i)}
					<div
						class="flex items-start gap-3 border-b border-light-one_d px-4 py-3 last:border-0 dark:border-dark-one_d"
					>
						<div class={['size-5 shrink-0', block]}></div>
						<div class="flex-1 space-y-2">
							<div class={['h-4 w-1/2', block]}></div>
							<div class={['h-3 w-1/3', block]}></div>
						</div>
						<div class={['h-9 w-28', block]}></div>
					</div>
				{/each}
			</div>
		</div>

		<div class={[card, 'hidden space-y-4 p-4 lg:block']}>
			<div class={['h-5 w-20', block]}></div>
			<div class={['h-10 w-full', block]}></div>
			<div class={['h-10 w-full', block]}></div>
			<div class={['h-4 w-40', block]}></div>
			<div class={['mt-6 h-8 w-full', block]}></div>
			<div class={['h-12 w-full', block]}></div>
		</div>
	</div>
</div>
