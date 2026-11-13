<script lang="ts">
	import { resolve } from '$app/paths';
	import { TableCell, TableRow } from '#lib/components/ui/index.ts';
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
</script>

<TableRow
	class="border-light-one_d hover:bg-light-one_d/50 dark:border-dark-one_d dark:hover:bg-dark-one_d/50"
>
	<TableCell class="px-4 py-3 text-sm whitespace-nowrap">
		<p class="text-light-two dark:text-dark-two">{cuando.fecha}</p>
		<p class="text-xs text-light-two_d dark:text-dark-two_d">{cuando.hora}</p>
	</TableCell>
	<TableCell class="px-4 py-3 text-sm">
		<a
			{href}
			class="font-medium text-light-two tabular-nums underline-offset-2 hover:underline dark:text-dark-two"
		>
			{formatVentaNumero(linea.numero)}
		</a>
		<p class="truncate text-xs text-light-two_d dark:text-dark-two_d">
			{VENTA_CANAL_LABEL[linea.canal] ?? linea.canal}
		</p>
	</TableCell>
	<TableCell class="px-4 py-3 text-sm">
		<FinanzasPrenda
			producto={linea.producto}
			color={linea.color}
			talla={linea.talla}
			codigoBarras={linea.codigo_barras}
		/>
	</TableCell>
	<TableCell class="hidden px-4 py-3 text-sm xl:table-cell">
		<p class="truncate text-light-two dark:text-dark-two" title={linea.vendedor}>
			{linea.vendedor}
		</p>
		<p class="truncate text-xs text-light-two_d dark:text-dark-two_d" title={metodos}>
			{metodos || '—'}
		</p>
	</TableCell>
	<TableCell class="px-4 py-3 text-right text-sm text-light-two tabular-nums dark:text-dark-two">
		{formatNumber(linea.cantidad)}
	</TableCell>
	<TableCell
		class="hidden px-4 py-3 text-right text-sm whitespace-nowrap tabular-nums lg:table-cell"
	>
		<p class="text-light-two dark:text-dark-two">{formatCurrency(linea.precio_cobrado)}</p>
		{#if linea.precio_normal !== linea.precio_cobrado}
			<p class="text-xs text-light-two_d line-through dark:text-dark-two_d">
				<span class="sr-only">Precio normal</span>
				{formatCurrency(linea.precio_normal)}
			</p>
		{/if}
	</TableCell>
	<TableCell
		class="px-4 py-3 text-right text-sm whitespace-nowrap text-light-two_d tabular-nums dark:text-dark-two_d"
	>
		<span
			title={descuento > 0
				? `Por prenda ${formatCurrency(linea.descuento_prenda)} · por venta ${formatCurrency(linea.descuento_venta)}`
				: undefined}
		>
			{descuento > 0 ? `− ${formatCurrency(descuento)}` : '—'}
		</span>
	</TableCell>
	<TableCell
		class="px-4 py-3 text-right text-sm font-semibold whitespace-nowrap text-light-two tabular-nums dark:text-dark-two"
	>
		{formatCurrency(linea.total)}
	</TableCell>
</TableRow>
