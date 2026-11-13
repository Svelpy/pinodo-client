<script lang="ts">
	// Mismas secciones que el formulario de "Mi negocio": identidad, contacto, ubicación, horario y redes
	const block = 'bg-light-one_d dark:bg-dark-one_d';
	const card =
		'animate-pulse border border-light-one_d bg-light-one p-4 sm:p-6 dark:border-dark-one_d dark:bg-dark-one';
	const campos = [4, 3, 3];
</script>

<div role="status" aria-label="Cargando datos del negocio" class="space-y-4">
	<span class="sr-only">Cargando…</span>

	<div class="space-y-4" aria-hidden="true">
		{#each campos as cantidad, seccion (seccion)}
			<div class={card}>
				<div class={['mb-2 h-5 w-32', block]}></div>
				<div class={['mb-5 h-3 w-2/3 max-w-sm', block]}></div>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					{#each { length: cantidad }, i (i)}
						<div class="space-y-2">
							<div class={['h-4 w-24', block]}></div>
							<div class={['h-11 w-full', block]}></div>
						</div>
					{/each}
				</div>
			</div>
		{/each}

		<!-- Horario -->
		<div class={card}>
			<div class={['mb-5 h-5 w-24', block]}></div>
			<div class="space-y-3">
				{#each { length: 7 }, i (i)}
					<div class="flex items-center gap-4">
						<div class={['h-5 w-28', block]}></div>
						<div class={['h-10 w-28', block]}></div>
						<div class={['h-10 w-28', block]}></div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>
