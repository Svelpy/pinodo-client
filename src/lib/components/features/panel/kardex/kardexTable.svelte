<script lang="ts">
	import { Table, TableBody, TableHead, TableHeader, TableRow } from '#lib/components/ui/index.ts';
	import type { MovimientoInventario, SkuNombre } from '#lib/interfaces/index.ts';
	import KardexRow from './kardexRow.svelte';

	interface Props {
		movimientos: MovimientoInventario[];
		/** Id de SKU → nombre */
		skus: ReadonlyMap<string, SkuNombre>;
		/** Id de usuario → nombre; null = no se muestra la columna Usuario */
		usuarios: ReadonlyMap<string, string> | null;
		/** false en el kardex de un SKU */
		mostrarSku?: boolean;
		onSelect: (movimiento: MovimientoInventario) => void;
	}

	let { movimientos, skus, usuarios, mostrarSku = true, onSelect }: Props = $props();

	const headClass = 'h-11 text-xs tracking-wide text-light-two_d uppercase dark:text-dark-two_d';
</script>

<div class="overflow-x-auto">
	<Table class="table-fixed text-sm">
		<TableHeader>
			<TableRow class="border-light-one_d hover:bg-transparent dark:border-dark-one_d">
				<TableHead class="{headClass} w-48">Fecha</TableHead>
				{#if mostrarSku}
					<TableHead class={headClass}>Producto</TableHead>
				{/if}
				<!-- Sin la columna Producto, Tipo (con la venta o el motivo) ocupa el ancho libre -->
				<TableHead class={[headClass, mostrarSku && 'w-36']}>Tipo</TableHead>
				<TableHead class="{headClass} w-24 text-right">Cantidad</TableHead>
				<TableHead class="{headClass} w-20 text-right" title="Stock del SKU tras el movimiento">
					Saldo
				</TableHead>
				<TableHead class="{headClass} hidden w-32 text-right lg:table-cell">Costo unit.</TableHead>
				<TableHead class="{headClass} hidden w-32 text-right xl:table-cell">Costo prom.</TableHead>
				{#if usuarios}
					<TableHead class="{headClass} hidden w-40 2xl:table-cell">Usuario</TableHead>
				{/if}
			</TableRow>
		</TableHeader>
		<TableBody>
			{#each movimientos as movimiento (movimiento.id)}
				<KardexRow
					{movimiento}
					sku={skus.get(movimiento.sku_id)}
					usuario={movimiento.created_by ? usuarios?.get(movimiento.created_by) : undefined}
					{mostrarSku}
					mostrarUsuario={!!usuarios}
					{onSelect}
				/>
			{/each}
		</TableBody>
	</Table>
</div>
