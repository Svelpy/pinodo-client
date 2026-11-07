<script lang="ts">
	// Sirve a la ficha del producto y al formulario de alta mientras cargan sus datos
	const block = 'bg-light-one_d dark:bg-dark-one_d';
	const card =
		'animate-pulse border border-light-one_d bg-light-one p-4 sm:p-6 dark:border-dark-one_d dark:bg-dark-one';
</script>

<div role="status" aria-label="Cargando producto" class="space-y-4">
	<span class="sr-only">Cargando…</span>

	<div class="space-y-4" aria-hidden="true">
		<!-- Resumen: portada + datos -->
		<div class={card}>
			<div class="flex flex-col gap-4 sm:flex-row">
				<div class={['size-28 shrink-0 sm:size-36', block]}></div>
				<div class="flex-1 space-y-3">
					<div class={['h-6 w-1/2', block]}></div>
					<div class={['h-4 w-1/4', block]}></div>
					<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
						{#each { length: 4 }, i (i)}
							<div class="space-y-2">
								<div class={['h-3 w-16', block]}></div>
								<div class={['h-5 w-20', block]}></div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>

		<!-- Detalles -->
		<div class={card}>
			<div class={['mb-4 h-5 w-24', block]}></div>
			<div class="space-y-4">
				{#each { length: 3 }, i (i)}
					<div class="space-y-2">
						<div class={['h-3 w-20', block]}></div>
						<div class={['h-4 w-2/3', block]}></div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Un color con su galería -->
		<div class={card}>
			<div class="mb-4 flex items-center gap-3">
				<div class={['size-8 shrink-0', block]}></div>
				<div class={['h-5 w-32', block]}></div>
			</div>
			<div class="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
				{#each { length: 4 }, i (i)}
					<div class={['aspect-square', block]}></div>
				{/each}
			</div>
		</div>
	</div>
</div>
