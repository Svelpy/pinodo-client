<script lang="ts">
	import { TableCell, TableRow } from '#lib/components/ui/index.ts';
	import type { CostoSku } from '#lib/interfaces/index.ts';
	import {
		formatCurrency,
		formatNumber,
		formatValue,
		skuNombreDesdeCosto,
		varianteSku
	} from '#lib/utils/index.ts';
	import KardexCostoLink from './kardexCostoLink.svelte';
	import KardexSku from './kardexSku.svelte';

	interface Props {
		costo: CostoSku;
	}

	let { costo }: Props = $props();

	const sku = $derived(skuNombreDesdeCosto(costo));
</script>

<TableRow
	class="border-light-one_d hover:bg-light-one_d/50 dark:border-dark-one_d dark:hover:bg-dark-one_d/50"
>
	<TableCell class="px-4 py-3 text-sm">
		<KardexSku {sku} />
	</TableCell>
	<TableCell
		class="hidden truncate px-4 py-3 text-sm text-light-two_d tabular-nums lg:table-cell dark:text-dark-two_d"
	>
		{formatValue(costo.codigo_barras)}
	</TableCell>
	<TableCell
		class="px-4 py-3 text-right text-sm font-semibold text-light-two tabular-nums dark:text-dark-two"
	>
		{formatNumber(costo.cantidad)}
	</TableCell>
	<TableCell
		class="px-4 py-3 text-right text-sm whitespace-nowrap text-light-two_d tabular-nums dark:text-dark-two_d"
	>
		{formatCurrency(costo.costo)}
	</TableCell>
	<TableCell
		class="px-4 py-3 text-right text-sm font-semibold whitespace-nowrap text-light-two tabular-nums dark:text-dark-two"
	>
		{formatCurrency(costo.valor)}
	</TableCell>
	<TableCell class="px-2 py-3 text-right">
		<KardexCostoLink skuId={costo.sku_id} nombre="{costo.producto_nombre}, {varianteSku(sku)}" />
	</TableCell>
</TableRow>
