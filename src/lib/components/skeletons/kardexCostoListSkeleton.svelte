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

	let { items = 6 }: Props = $props();

	const WIDTHS = ['w-1/2', 'w-2/3', 'w-2/5', 'w-3/5', 'w-1/3'];
	const headClass = 'h-11 text-xs tracking-wide text-light-two_d uppercase dark:text-dark-two_d';
	const block = 'bg-light-one_d dark:bg-dark-one_d';
</script>

<div role="status" aria-label="Cargando el valor del stock">
	<span class="sr-only">Cargando…</span>

	<!-- Móvil: tarjetas (mismo layout que KardexCostoCard) -->
	<div class="grid gap-3 p-3 sm:grid-cols-2 md:hidden" aria-hidden="true">
		{#each { length: items }, i (i)}
			<div
				class="animate-pulse border border-light-one_d bg-light-one p-4 dark:border-dark-one_d dark:bg-dark-one"
			>
				<div class="flex items-start gap-2">
					<div class="flex-1 space-y-1.5">
						<div class={['h-4', block, WIDTHS[i % WIDTHS.length]]}></div>
						<div class={['h-3 w-1/2', block]}></div>
					</div>
					<div class={['size-9', block]}></div>
				</div>
				<div class="mt-3 grid grid-cols-3 gap-2">
					{#each { length: 3 }, j (j)}
						<div class="space-y-1">
							<div class={['h-3 w-10', block]}></div>
							<div class={['h-4 w-16', block]}></div>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<!-- Escritorio: tabla (mismas columnas que KardexCostoTable) -->
	<div class="hidden overflow-x-auto md:block" aria-hidden="true">
		<Table class="table-fixed text-sm">
			<TableHeader>
				<TableRow class="border-light-one_d hover:bg-transparent dark:border-dark-one_d">
					<TableHead class={headClass}>Producto</TableHead>
					<TableHead class="{headClass} hidden w-40 lg:table-cell">Código</TableHead>
					<TableHead class="{headClass} w-24 text-right">Stock</TableHead>
					<TableHead class="{headClass} w-36 text-right">Costo prom.</TableHead>
					<TableHead class="{headClass} w-36 text-right">Valor</TableHead>
					<TableHead class="h-11 w-14 px-2"><span class="sr-only">Kardex</span></TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each { length: items }, i (i)}
					<TableRow
						class="animate-pulse border-light-one_d hover:bg-transparent dark:border-dark-one_d"
					>
						<TableCell class="px-4 py-3">
							<div class={['h-3.5', block, WIDTHS[i % WIDTHS.length]]}></div>
							<div class={['mt-1.5 h-3 w-24', block]}></div>
						</TableCell>
						<TableCell class="hidden px-4 py-3 lg:table-cell">
							<div class={['h-3.5 w-28', block]}></div>
						</TableCell>
						<TableCell class="px-4 py-3"><div class={['ml-auto h-3.5 w-8', block]}></div></TableCell
						>
						<TableCell class="px-4 py-3">
							<div class={['ml-auto h-3.5 w-20', block]}></div>
						</TableCell>
						<TableCell class="px-4 py-3">
							<div class={['ml-auto h-3.5 w-20', block]}></div>
						</TableCell>
						<TableCell class="px-2 py-3"><div class={['ml-auto size-9', block]}></div></TableCell>
					</TableRow>
				{/each}
			</TableBody>
		</Table>
	</div>
</div>
