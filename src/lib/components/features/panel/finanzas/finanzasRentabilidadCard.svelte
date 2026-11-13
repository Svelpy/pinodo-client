<script lang="ts">
	import type { RentabilidadSku } from '#lib/interfaces/index.ts';
	import { formatCurrency, formatNumber } from '#lib/utils/index.ts';
	import FinanzasMargen from './finanzasMargen.svelte';
	import FinanzasPrenda from './finanzasPrenda.svelte';

	interface Props {
		sku: RentabilidadSku;
	}

	let { sku }: Props = $props();

	const labelClass = 'text-xs text-light-two_d dark:text-dark-two_d';
	const valueClass = 'font-semibold text-light-two tabular-nums dark:text-dark-two';
</script>

<article class="border border-light-one_d bg-light-one p-4 dark:border-dark-one_d dark:bg-dark-one">
	<div class="flex items-start gap-2">
		<FinanzasPrenda
			producto={sku.producto}
			color={sku.color}
			talla={sku.talla}
			codigoBarras={sku.codigo_barras}
			class="flex-1 text-sm"
		/>
		<span class="shrink-0 text-xs text-light-two_d tabular-nums dark:text-dark-two_d">
			<span class="sr-only">Cantidad</span>× {formatNumber(sku.cantidad)}
		</span>
	</div>
	<dl class="mt-3 grid grid-cols-3 gap-2 text-sm">
		<div>
			<dt class={labelClass}>Ingreso</dt>
			<dd class={valueClass}>{formatCurrency(sku.ingreso_neto)}</dd>
		</div>
		<div>
			<dt class={labelClass}>Costo</dt>
			<dd class={valueClass}>{formatCurrency(sku.costo)}</dd>
		</div>
		<div class="text-right">
			<dt class={labelClass}>Margen</dt>
			<dd class={valueClass}>{formatCurrency(sku.margen_bruto)}</dd>
			<dd class="text-xs"><FinanzasMargen value={sku.margen_porcentaje} /></dd>
		</div>
	</dl>
</article>
