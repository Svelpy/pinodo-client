<script lang="ts">
	import { TableCell, TableRow } from '#lib/components/ui/index.ts';
	import type { RentabilidadSku } from '#lib/interfaces/index.ts';
	import { formatCurrency, formatNumber } from '#lib/utils/index.ts';
	import FinanzasMargen from './finanzasMargen.svelte';
	import FinanzasPrenda from './finanzasPrenda.svelte';

	interface Props {
		sku: RentabilidadSku;
	}

	let { sku }: Props = $props();

	const cellClass = 'px-4 py-3 text-right text-sm whitespace-nowrap tabular-nums';
</script>

<TableRow
	class="border-light-one_d hover:bg-light-one_d/50 dark:border-dark-one_d dark:hover:bg-dark-one_d/50"
>
	<TableCell class="px-4 py-3 text-sm">
		<FinanzasPrenda
			producto={sku.producto}
			color={sku.color}
			talla={sku.talla}
			codigoBarras={sku.codigo_barras}
		/>
	</TableCell>
	<TableCell class="{cellClass} text-light-two dark:text-dark-two">
		{formatNumber(sku.cantidad)}
	</TableCell>
	<TableCell class="{cellClass} hidden text-light-two_d lg:table-cell dark:text-dark-two_d">
		{sku.descuentos > 0 ? `− ${formatCurrency(sku.descuentos)}` : '—'}
	</TableCell>
	<TableCell class="{cellClass} text-light-two dark:text-dark-two">
		{formatCurrency(sku.ingreso_neto)}
	</TableCell>
	<TableCell class="{cellClass} text-light-two_d dark:text-dark-two_d">
		{formatCurrency(sku.costo)}
	</TableCell>
	<TableCell class="{cellClass} font-semibold text-light-two dark:text-dark-two">
		{formatCurrency(sku.margen_bruto)}
	</TableCell>
	<TableCell class={cellClass}>
		<FinanzasMargen value={sku.margen_porcentaje} />
	</TableCell>
</TableRow>
