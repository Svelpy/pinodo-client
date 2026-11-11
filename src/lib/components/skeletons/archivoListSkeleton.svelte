<script lang="ts">
	interface Props {
		/** Cantidad de tarjetas a mostrar */
		items?: number;
	}

	let { items = 10 }: Props = $props();

	const NAME_WIDTHS = ['w-3/4', 'w-2/3', 'w-1/2', 'w-3/5', 'w-4/5'];
	const block = 'bg-light-one_d dark:bg-dark-one_d';
</script>

<div role="status" aria-label="Cargando archivos">
	<span class="sr-only">Cargando…</span>

	<!-- Misma grilla que ArchivoList -->
	<div
		class="grid grid-cols-2 gap-3 p-3 sm:grid-cols-3 md:p-4 lg:grid-cols-4 xl:grid-cols-5"
		aria-hidden="true"
	>
		{#each { length: items }, i (i)}
			<div
				class="animate-pulse border border-light-one_d bg-light-one dark:border-dark-one_d dark:bg-dark-one"
			>
				<div class={['aspect-square w-full', block]}></div>
				<div class="space-y-2 p-3">
					<div class={['h-3.5', block, NAME_WIDTHS[i % NAME_WIDTHS.length]]}></div>
					<div class={['h-3 w-1/3', block]}></div>
					<div class={['h-3 w-1/4', block]}></div>
				</div>
			</div>
		{/each}
	</div>
</div>
