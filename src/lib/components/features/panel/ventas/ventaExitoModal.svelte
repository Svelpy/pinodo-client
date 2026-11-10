<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button, Sheet } from '#lib/components/ui/index.ts';
	import { METODO_PAGO_LABEL, VENTA_ESTADO } from '#lib/constants/index.ts';
	import {
		CheckCircleIcon,
		FileDescriptionIcon,
		PlusIcon,
		PrinterIcon,
		WhatsappIcon
	} from '#lib/icons/outline/index.ts';
	import type { VentaDetalle } from '#lib/interfaces/index.ts';
	import { currentTiendaStore } from '#lib/stores/index.ts';
	import { buildWhatsappUrl, formatCurrency, formatVentaNumero } from '#lib/utils/index.ts';
	import VentaComprobante from './ventaComprobante.svelte';

	interface Props {
		/** Venta recién registrada; null = cerrado */
		venta: VentaDetalle | null;
		/** Cambio a entregar si pagó en efectivo */
		cambio?: number | null;
		/** Cierra y deja la caja lista para la siguiente venta */
		onNuevaVenta: () => void;
	}

	let { venta, cambio = null, onNuevaVenta }: Props = $props();

	const cobrada = $derived(venta?.estado === VENTA_ESTADO.CONFIRMADA);
	const titulo = $derived(cobrada ? 'Venta cobrada' : 'Pedido guardado');
</script>

<Sheet open={!!venta} title={titulo} hideTitle onClose={onNuevaVenta}>
	{#if venta}
		<div class="flex flex-col items-center pt-2 text-center">
			<span
				class="flex size-14 items-center justify-center bg-light-success/10 text-light-success dark:bg-dark-success/10 dark:text-dark-success"
			>
				<CheckCircleIcon class="size-8" />
			</span>
			<p class="mt-3 text-lg font-bold text-light-two dark:text-dark-two">{titulo}</p>
			<p class="text-sm text-light-two_d dark:text-dark-two_d">
				{cobrada ? 'Venta' : 'Pedido'}
				{formatVentaNumero(venta.numero)}{venta.referencia ? ` · ${venta.referencia}` : ''}
			</p>
			<p class="mt-3 text-3xl font-bold text-light-two tabular-nums dark:text-dark-two">
				{formatCurrency(venta.total)}
			</p>
			{#if venta.metodo_pago}
				<p class="text-sm text-light-two_d dark:text-dark-two_d">
					{METODO_PAGO_LABEL[venta.metodo_pago]}
				</p>
			{/if}
			{#if cobrada && cambio !== null && cambio > 0}
				<p
					class="mt-3 w-full border border-light-success/30 bg-light-success/10 px-3 py-2 text-light-two dark:border-dark-success/30 dark:bg-dark-success/10 dark:text-dark-two"
				>
					Cambio a entregar: <span class="font-bold">{formatCurrency(cambio)}</span>
				</p>
			{/if}
			{#if !cobrada}
				<p class="mt-3 text-sm text-light-two_d dark:text-dark-two_d">
					El stock se descontará cuando lo cobres desde el historial.
				</p>
			{/if}
		</div>

		<div class="mt-5 grid gap-2 sm:grid-cols-2">
			<Button variant="outline" onclick={() => window.print()}>
				{#snippet leftIcon()}<PrinterIcon class="size-4" />{/snippet}
				Imprimir
			</Button>
			<Button
				variant="outline"
				href={buildWhatsappUrl(venta, $currentTiendaStore?.nombre_tienda)}
				target="_blank"
				rel="noopener noreferrer"
			>
				{#snippet leftIcon()}<WhatsappIcon class="size-4" />{/snippet}
				WhatsApp
			</Button>
			<Button
				variant="ghost"
				href={resolve('/panel/ventas/historial/[id]', { id: venta.id })}
				class="sm:col-span-2"
			>
				{#snippet leftIcon()}<FileDescriptionIcon class="size-4" />{/snippet}
				Ver detalle
			</Button>
		</div>

		<VentaComprobante {venta} />
	{/if}

	{#snippet footer()}
		<Button size="lg" fullWidth onclick={onNuevaVenta} autofocus>
			{#snippet leftIcon()}<PlusIcon class="size-5" />{/snippet}
			Nueva venta
		</Button>
	{/snippet}
</Sheet>
