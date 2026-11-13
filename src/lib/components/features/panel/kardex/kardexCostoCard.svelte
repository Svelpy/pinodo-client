<script lang="ts">
	import type { CostoSku } from '#lib/interfaces/index.ts';
	import {
		formatCurrency,
		formatNumber,
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
	const labelClass = 'text-xs text-light-two_d dark:text-dark-two_d';
	const valueClass = 'font-semibold text-light-two tabular-nums dark:text-dark-two';
</script>

<article class="border border-light-one_d bg-light-one p-4 dark:border-dark-one_d dark:bg-dark-one">
	<div class="flex items-start gap-2">
		<KardexSku {sku} mostrarCodigo class="flex-1 text-sm" />
		<KardexCostoLink
			skuId={costo.sku_id}
			nombre="{costo.producto_nombre}, {varianteSku(sku)}"
			class="-mt-1.5 -mr-2 shrink-0"
		/>
	</div>
	<dl class="mt-3 grid grid-cols-3 gap-2 text-sm">
		<div>
			<dt class={labelClass}>Stock</dt>
			<dd class={valueClass}>{formatNumber(costo.cantidad)}</dd>
		</div>
		<div>
			<dt class={labelClass}>Costo prom.</dt>
			<dd class={valueClass}>{formatCurrency(costo.costo)}</dd>
		</div>
		<div class="text-right">
			<dt class={labelClass}>Valor</dt>
			<dd class={valueClass}>{formatCurrency(costo.valor)}</dd>
		</div>
	</dl>
</article>
