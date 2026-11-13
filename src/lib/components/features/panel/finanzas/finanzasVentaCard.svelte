<script lang="ts">
	import { resolve } from '$app/paths';
	import { METODO_PAGO_LABEL, VENTA_CANAL_LABEL } from '#lib/constants/index.ts';
	import type { ReporteVentaLinea } from '#lib/interfaces/index.ts';
	import {
		formatCurrency,
		formatDateTimeParts,
		formatNumber,
		formatVentaNumero
	} from '#lib/utils/index.ts';
	import FinanzasPrenda from './finanzasPrenda.svelte';

	interface Props {
		linea: ReporteVentaLinea;
	}

	let { linea }: Props = $props();

	const cuando = $derived(formatDateTimeParts(`${linea.fecha}T${linea.hora}`));
	const href = $derived(resolve('/panel/ventas/historial/[id]', { id: linea.venta_id }));
	const descuento = $derived(linea.descuento_prenda + linea.descuento_venta);
	const metodos = $derived(
		linea.metodos_pago.map((metodo) => METODO_PAGO_LABEL[metodo] ?? metodo).join(' + ')
	);

	const labelClass = 'text-xs text-light-two_d dark:text-dark-two_d';
	const valueClass = 'font-semibold text-light-two tabular-nums dark:text-dark-two';
</script>

<article class="border border-light-one_d bg-light-one p-4 dark:border-dark-one_d dark:bg-dark-one">
	<div
		class="flex items-baseline justify-between gap-2 text-xs text-light-two_d dark:text-dark-two_d"
	>
		<span>{cuando.fecha} · {cuando.hora}</span>
		<a
			{href}
			class="font-medium text-light-two tabular-nums underline-offset-2 hover:underline dark:text-dark-two"
		>
			{formatVentaNumero(linea.numero)}
		</a>
	</div>
	<FinanzasPrenda
		producto={linea.producto}
		color={linea.color}
		talla={linea.talla}
		codigoBarras={linea.codigo_barras}
		class="mt-2 text-sm"
	/>
	<p class="mt-1 truncate text-xs text-light-two_d dark:text-dark-two_d">
		{VENTA_CANAL_LABEL[linea.canal] ?? linea.canal} · {linea.vendedor}{metodos
			? ` · ${metodos}`
			: ''}
	</p>
	<dl class="mt-3 grid grid-cols-3 gap-2 text-sm">
		<div>
			<dt class={labelClass}>Cant.</dt>
			<dd class={valueClass}>{formatNumber(linea.cantidad)}</dd>
		</div>
		<div>
			<dt class={labelClass}>Desc.</dt>
			<dd class={valueClass}>{descuento > 0 ? `− ${formatCurrency(descuento)}` : '—'}</dd>
		</div>
		<div class="text-right">
			<dt class={labelClass}>Total</dt>
			<dd class={valueClass}>{formatCurrency(linea.total)}</dd>
		</div>
	</dl>
</article>
