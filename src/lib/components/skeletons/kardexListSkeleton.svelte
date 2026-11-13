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
		/** false en el kardex de un SKU (sin columna Producto, como KardexTable) */
		mostrarSku?: boolean;
	}

	let { items = 6, mostrarSku = true }: Props = $props();

	const WIDTHS = ['w-1/2', 'w-2/3', 'w-2/5', 'w-3/5', 'w-1/3'];
	const headClass = 'h-11 text-xs tracking-wide text-light-two_d uppercase dark:text-dark-two_d';
	const block = 'bg-light-one_d dark:bg-dark-one_d';
</script>

<div role="status" aria-label="Cargando movimientos">
	<span class="sr-only">Cargando…</span>

	<!-- Móvil: tarjetas (mismo layout que KardexCard) -->
	<div class="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 md:hidden" aria-hidden="true">
		{#each { length: items }, i (i)}
			<div
				class="flex animate-pulse gap-3 border border-light-one_d bg-light-one p-4 dark:border-dark-one_d dark:bg-dark-one"
			>
				<div class="min-w-0 flex-1 space-y-2">
					{#if mostrarSku}
						<div class={['h-4', block, WIDTHS[i % WIDTHS.length]]}></div>
					{/if}
					<div class={['h-5 w-20', block]}></div>
					<div class={['h-3 w-1/2', block]}></div>
				</div>
				<div class="flex flex-col items-end justify-between gap-2">
					<div class={['h-6 w-10', block]}></div>
					<div class={['h-3 w-14', block]}></div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Escritorio: tabla (mismas columnas que KardexTable) -->
	<div class="hidden overflow-x-auto md:block" aria-hidden="true">
		<Table class="table-fixed text-sm">
			<TableHeader>
				<TableRow class="border-light-one_d hover:bg-transparent dark:border-dark-one_d">
					<TableHead class="{headClass} w-48">Fecha</TableHead>
					{#if mostrarSku}
						<TableHead class={headClass}>Producto</TableHead>
					{/if}
					<TableHead class={[headClass, mostrarSku && 'w-44']}>Movimiento</TableHead>
					<TableHead class="{headClass} w-24 text-right">Cantidad</TableHead>
					<TableHead class="{headClass} w-20 text-right">Saldo</TableHead>
					<TableHead class="{headClass} hidden w-32 text-right lg:table-cell">
						Costo unit.
					</TableHead>
					<TableHead class="{headClass} hidden w-32 text-right lg:table-cell">
						Costo total
					</TableHead>
					<TableHead class="{headClass} hidden w-32 text-right xl:table-cell">
						Costo prom.
					</TableHead>
					<TableHead class="{headClass} hidden w-32 text-right xl:table-cell">
						Valor saldo
					</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{#each { length: items }, i (i)}
					<TableRow
						class="animate-pulse border-light-one_d hover:bg-transparent dark:border-dark-one_d"
					>
						<TableCell class="px-4 py-3">
							<div class={['h-3.5 w-32', block]}></div>
							<div class={['mt-1.5 h-3 w-20', block]}></div>
						</TableCell>
						{#if mostrarSku}
							<TableCell class="px-4 py-3">
								<div class={['h-3.5', block, WIDTHS[i % WIDTHS.length]]}></div>
								<div class={['mt-1.5 h-3 w-20', block]}></div>
							</TableCell>
						{/if}
						<TableCell class="px-4 py-3"><div class={['h-5 w-20', block]}></div></TableCell>
						<TableCell class="px-4 py-3">
							<div class={['ml-auto h-3.5 w-8', block]}></div>
						</TableCell>
						<TableCell class="px-4 py-3">
							<div class={['ml-auto h-3.5 w-8', block]}></div>
						</TableCell>
						<TableCell class="hidden px-4 py-3 lg:table-cell">
							<div class={['ml-auto h-3.5 w-16', block]}></div>
						</TableCell>
						<TableCell class="hidden px-4 py-3 lg:table-cell">
							<div class={['ml-auto h-3.5 w-16', block]}></div>
						</TableCell>
						<TableCell class="hidden px-4 py-3 xl:table-cell">
							<div class={['ml-auto h-3.5 w-16', block]}></div>
						</TableCell>
						<TableCell class="hidden px-4 py-3 xl:table-cell">
							<div class={['ml-auto h-3.5 w-16', block]}></div>
						</TableCell>
					</TableRow>
				{/each}
			</TableBody>
		</Table>
	</div>
</div>
