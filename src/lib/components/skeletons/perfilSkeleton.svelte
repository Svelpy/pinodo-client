<script lang="ts">
	// Mismas partes que la página de perfil: resumen, datos personales y contraseña
	const block = 'bg-light-one_d dark:bg-dark-one_d';
	const card =
		'animate-pulse border border-light-one_d bg-light-one p-4 sm:p-6 dark:border-dark-one_d dark:bg-dark-one';
</script>

<div role="status" aria-label="Cargando perfil" class="space-y-4">
	<span class="sr-only">Cargando…</span>

	<div class="space-y-4" aria-hidden="true">
		<div class={[card, 'flex flex-col items-center gap-4 sm:flex-row']}>
			<div class={['size-12 shrink-0', block]}></div>
			<div class="w-full flex-1 space-y-2">
				<div class={['mx-auto h-5 w-48 sm:mx-0', block]}></div>
				<div class={['mx-auto h-4 w-40 sm:mx-0', block]}></div>
			</div>
		</div>

		<div class={card}>
			<div class={['mb-5 h-5 w-36', block]}></div>
			<div class="grid gap-4 sm:grid-cols-2">
				{#each { length: 4 }, i (i)}
					<div class="space-y-2">
						<div class={['h-4 w-24', block]}></div>
						<div class={['h-11 w-full', block]}></div>
					</div>
				{/each}
			</div>
		</div>

		<div class={card}>
			<div class={['mb-2 h-5 w-28', block]}></div>
			<div class={['h-4 w-2/3', block]}></div>
		</div>
	</div>
</div>
