<script lang="ts">
	interface Props {
		/** Cantidad de secciones a mostrar */
		sections?: number;
	}

	let { sections = 2 }: Props = $props();

	// Anchos variados y sangrías para sugerir un árbol; las líneas no se ven idénticas
	const ROWS = [
		{ depth: 0, width: 'w-1/4' },
		{ depth: 1, width: 'w-1/3' },
		{ depth: 2, width: 'w-1/5' },
		{ depth: 1, width: 'w-2/5' },
		{ depth: 0, width: 'w-1/3' }
	];
	const INDENT = ['pl-2', 'pl-7', 'pl-12'];

	const groups = $derived(Array.from({ length: sections }, (_, i) => i));
	const block = 'bg-light-one_d dark:bg-dark-one_d';
</script>

<div role="status" aria-label="Cargando categorías">
	<span class="sr-only">Cargando…</span>

	<div class="space-y-4 p-3" aria-hidden="true">
		{#each groups as group (group)}
			<div
				class="animate-pulse border border-light-one_d bg-light-one dark:border-dark-one_d dark:bg-dark-one"
			>
				<!-- Mismo layout que CategoriaSeccion -->
				<div class="flex items-center gap-3 px-4 py-3">
					<div class="flex-1 space-y-2">
						<div class={['h-4 w-1/4', block]}></div>
						<div class={['h-3 w-16', block]}></div>
					</div>
					<div class={['h-5 w-20', block]}></div>
				</div>

				<!-- Mismas filas que CategoriaNodo -->
				{#each ROWS as row, i (i)}
					<div
						class={[
							'flex items-center gap-3 border-t border-light-one_d py-2.5 pr-3 dark:border-dark-one_d',
							INDENT[row.depth]
						]}
					>
						<div class={['size-5 shrink-0', block]}></div>
						<div class="flex-1 space-y-1.5">
							<div class={['h-3.5', block, row.width]}></div>
							<div class={['h-3 w-1/6', block]}></div>
						</div>
						<div class={['h-5 w-16 shrink-0', block]}></div>
						<div class={['size-9 shrink-0', block]}></div>
					</div>
				{/each}
			</div>
		{/each}
	</div>
</div>
