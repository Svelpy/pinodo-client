<script lang="ts">
	import {
		METODO_PAGO_LABEL,
		VENTA_CANAL_LABEL,
		VENTA_ESTADO,
		VENTA_ESTADO_LABEL
	} from '#lib/constants/index.ts';
	import type { VentaDetalle } from '#lib/interfaces/index.ts';
	import { currentTiendaStore } from '#lib/stores/index.ts';
	import { formatCurrency, formatDateTime, formatVentaNumero, portal } from '#lib/utils/index.ts';

	/**
	 * Ticket de la venta, visible solo al imprimir. Se mueve al <body> y, mientras está montado, la
	 * impresión oculta todo lo demás: basta con `window.print()`.
	 */
	interface Props {
		venta: VentaDetalle;
		/** Quién atendió, si se conoce */
		vendedor?: string | null;
	}

	let { venta, vendedor = null }: Props = $props();

	const tienda = $derived($currentTiendaStore);
	const esPedido = $derived(venta.estado === VENTA_ESTADO.PENDIENTE);
</script>

<svelte:head>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html `<style>@media print { body > *:not(.venta-comprobante) { display: none !important; } @page { margin: 8mm; } }</style>`}
</svelte:head>

<div
	use:portal
	class="venta-comprobante hidden bg-light-one font-mono text-[12px] leading-snug text-light-black print:block"
>
	<div class="mx-auto max-w-[80mm]">
		<header class="text-center">
			<p class="text-[15px] font-bold uppercase">{tienda?.nombre_tienda ?? 'Comprobante'}</p>
			{#if tienda?.direccion}
				<p>{tienda.direccion}{tienda.ciudad ? `, ${tienda.ciudad}` : ''}</p>
			{/if}
			{#if tienda?.telefono || tienda?.whatsapp}
				<p>Tel. {tienda.telefono ?? tienda.whatsapp}</p>
			{/if}
		</header>

		<div class="my-2 border-t border-dashed border-light-black"></div>

		<p class="text-center font-bold">
			{esPedido ? 'PROFORMA / PEDIDO' : 'NOTA DE VENTA'}
			{formatVentaNumero(venta.numero)}
		</p>
		<p>Fecha: {formatDateTime(venta.confirmada_at ?? venta.created_at)}</p>
		<p>Canal: {VENTA_CANAL_LABEL[venta.canal]}</p>
		{#if venta.referencia}
			<p>Cliente: {venta.referencia}</p>
		{/if}
		{#if venta.cliente_telefono}
			<p>Teléfono: {venta.cliente_telefono}</p>
		{/if}
		{#if vendedor}
			<p>Atendió: {vendedor}</p>
		{/if}
		{#if venta.estado === VENTA_ESTADO.CANCELADA}
			<p class="font-bold">ESTADO: {VENTA_ESTADO_LABEL[venta.estado].toUpperCase()}</p>
		{/if}

		<div class="my-2 border-t border-dashed border-light-black"></div>

		<table class="w-full">
			<thead>
				<tr class="text-left">
					<th class="font-bold">Cant. Detalle</th>
					<th class="text-right font-bold">Importe</th>
				</tr>
			</thead>
			<tbody>
				{#each venta.items as item (item.id)}
					<tr class="align-top">
						<td class="pt-1 pr-2">
							{item.cantidad} × {item.producto_nombre}
							<br />
							<span class="text-[11px]">
								{item.color_nombre} · T. {item.talla_etiqueta} · {formatCurrency(
									item.precio_unitario
								)}{item.descuento_unitario > 0
									? ` −${formatCurrency(item.descuento_unitario)}`
									: ''}
							</span>
						</td>
						<td class="pt-1 text-right whitespace-nowrap">{formatCurrency(item.subtotal)}</td>
					</tr>
				{/each}
			</tbody>
		</table>

		<div class="my-2 border-t border-dashed border-light-black"></div>

		<dl>
			{#if venta.descuento > 0}
				<div class="flex justify-between">
					<dt>Subtotal</dt>
					<dd>{formatCurrency(venta.subtotal)}</dd>
				</div>
				<div class="flex justify-between">
					<dt>Descuento</dt>
					<dd>−{formatCurrency(venta.descuento)}</dd>
				</div>
			{/if}
			<div class="flex justify-between text-[14px] font-bold">
				<dt>TOTAL</dt>
				<dd>{formatCurrency(venta.total)}</dd>
			</div>
			{#if venta.metodo_pago}
				<div class="flex justify-between">
					<dt>Pago</dt>
					<dd>{METODO_PAGO_LABEL[venta.metodo_pago]}</dd>
				</div>
			{/if}
		</dl>

		{#if venta.nota}
			<p class="mt-2">Nota: {venta.nota}</p>
		{/if}

		<div class="my-2 border-t border-dashed border-light-black"></div>
		<p class="text-center">¡Gracias por tu {esPedido ? 'pedido' : 'compra'}!</p>
	</div>
</div>
