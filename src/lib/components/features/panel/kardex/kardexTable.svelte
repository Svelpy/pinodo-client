<script lang="ts">
	import { Table, TableBody, TableHead, TableHeader, TableRow } from '#lib/components/ui/index.ts';
	import type { MovimientoInventario } from '#lib/interfaces/index.ts';
	import KardexRow from './kardexRow.svelte';

	interface Props {
		movimientos: MovimientoInventario[];
		/** false en el kardex de un SKU */
		mostrarSku?: boolean;
	}

	let { movimientos, mostrarSku = true }: Props = $props();

	const headClass = 'h-11 text-xs tracking-wide text-light-two_d uppercase dark:text-dark-two_d';
</script>

<div class="relative overflow-x-auto">
	<Table class="table-fixed text-sm">
		<TableHeader>
			<TableRow class="border-light-one_d hover:bg-transparent dark:border-dark-one_d">
				<TableHead class="{headClass} w-40">Fecha</TableHead>
				{#if mostrarSku}
					<TableHead class={headClass}>Producto</TableHead>
				{/if}
				<!-- Sin la columna Producto, Movimiento (con su documento) ocupa el ancho libre -->
				<TableHead class={[headClass, mostrarSku && 'w-44']}>Movimiento</TableHead>
				<TableHead class="{headClass} w-24 text-right">Cantidad</TableHead>
				<TableHead class="{headClass} w-20 text-right" title="Stock del SKU tras el movimiento">
					Saldo
				</TableHead>
				<TableHead class="{headClass} hidden w-32 text-right lg:table-cell">Costo unit.</TableHead>
				<TableHead class="{headClass} hidden w-32 text-right lg:table-cell">Costo total</TableHead>
				<TableHead class="{headClass} hidden w-32 text-right xl:table-cell">Costo prom.</TableHead>
				<TableHead
					class="{headClass} hidden w-32 text-right xl:table-cell"
					title="Saldo × costo promedio"
				>
					Valor saldo
				</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			{#each movimientos as movimiento (movimiento.id)}
				<KardexRow {movimiento} {mostrarSku} />
			{/each}
		</TableBody>
	</Table>
</div>
