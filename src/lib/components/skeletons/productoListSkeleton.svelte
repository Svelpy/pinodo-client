<script lang="ts">
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '#lib/components/ui/index.ts';

	interface Props {
		/** Cantidad de cards/filas a mostrar */
		items?: number;
	}

	let { items = 5 }: Props = $props();

	// Anchos variados para que las líneas no se vean idénticas
	const NAME_WIDTHS = ['w-1/2', 'w-2/3', 'w-2/5', 'w-3/5', 'w-1/3'];
	const DETAIL_WIDTHS = ['w-1/4', 'w-1/3', 'w-1/5', 'w-2/5', 'w-1/4'];

	const rows = $derived(Array.from({ length: items }, (_, i) => i));

	const headClass = 'h-11 text-xs tracking-wide text-light-two_d uppercase dark:text-dark-two_d';
	const block = 'bg-light-one_d dark:bg-dark-one_d';
</script>

<div role="status" aria-label="Cargando productos">
	<span class="sr-only">Cargando…</span>

	<!-- Móvil y tablet pequeña: tarjetas (mismo layout que ProductoCard) -->
	<div class="grid gap-3 p-3 sm:grid-cols-2 md:hidden" aria-hidden="true">
		{#each rows as i (i)}
			<div
				class="flex animate-pulse gap-3 border border-light-one_d bg-light-one p-4 dark:border-dark-one_d dark:bg-dark-one"
			>
				<div class={['size-16 shrink-0', block]}></div>
				<div class="min-w-0 flex-1 space-y-2">
					<div class={['h-4', block, NAME_WIDTHS[i % NAME_WIDTHS.length]]}></div>
					<div class={['h-3', block, DETAIL_WIDTHS[i % DETAIL_WIDTHS.length]]}></div>
					<div class={['h-4 w-2/3', block]}></div>
					<div class={['h-5 w-20', block]}></div>
				</div>
				<div class={['size-9 shrink-0', block]}></div>
			</div>
		{/each}
	</div>

	<!-- Tablet y escritorio: tabla (mismas columnas que ProductoTable) -->
	<div class="hidden overflow-x-auto md:block" aria-hidden="true">
		<Table class="table-fixed text-sm lg:min-w-[60rem] xl:min-w-[75rem]">
			<TableHeader>
				<TableRow class="border-light-one_d hover:bg-transparent dark:border-dark-one_d">
					<TableHead class={headClass}>Producto</TableHead>
					<TableHead class="{headClass} w-32">Colores</TableHead>
					<TableHead class="{headClass} hidden w-52 lg:table-cell">Precio</TableHead>
					<TableHead class="{headClass} hidden w-28 lg:table-cell">Stock</TableHead>
					<TableHead class="{headClass} w-40">Visibilidad</TableHead>
					<TableHead class="{headClass} hidden w-36 xl:table-cell">Creado</TableHead>
					<TableHead class="{headClass} hidden w-40 xl:table-cell">Actualizado</TableHead>
					<TableHead class="h-11 w-14 px-2">
						<span class="sr-only">Acciones</span>
					</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each rows as i (i)}
					<TableRow
						class="animate-pulse border-light-one_d hover:bg-transparent dark:border-dark-one_d"
					>
						<TableCell class="px-4 py-3">
							<div class="flex items-center gap-3">
								<div class={['size-12 shrink-0', block]}></div>
								<div class="min-w-0 flex-1 space-y-2">
									<div class={['h-3.5', block, NAME_WIDTHS[i % NAME_WIDTHS.length]]}></div>
									<div class={['h-3', block, DETAIL_WIDTHS[i % DETAIL_WIDTHS.length]]}></div>
								</div>
							</div>
						</TableCell>
						<TableCell class="px-4 py-3">
							<div class={['h-5 w-24', block]}></div>
						</TableCell>
						<TableCell class="hidden px-4 py-3 lg:table-cell">
							<div class={['h-3.5 w-28', block]}></div>
						</TableCell>
						<TableCell class="hidden px-4 py-3 lg:table-cell">
							<div class={['h-3.5 w-10', block]}></div>
						</TableCell>
						<TableCell class="px-4 py-3">
							<div class={['h-5 w-20', block]}></div>
						</TableCell>
						<TableCell class="hidden px-4 py-3 xl:table-cell">
							<div class={['h-3.5 w-24', block]}></div>
						</TableCell>
						<TableCell class="hidden px-4 py-3 xl:table-cell">
							<div class={['h-3.5 w-20', block]}></div>
						</TableCell>
						<TableCell class="px-2 py-3">
							<div class={['ml-auto size-9', block]}></div>
						</TableCell>
					</TableRow>
				{/each}
			</TableBody>
		</Table>
	</div>
</div>
