<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { TableCell, TableRow } from '#lib/components/ui/index.ts';
	import { VENTA_ESTADO } from '#lib/constants/index.ts';
	import type { Venta } from '#lib/interfaces/index.ts';
	import {
		formatCurrency,
		formatDateTimeParts,
		formatValue,
		formatVentaNumero
	} from '#lib/utils/index.ts';
	import VentaActions from './ventaActions.svelte';
	import VentaCanal from './ventaCanal.svelte';
	import VentaEstadoBadge from './ventaEstadoBadge.svelte';
	import VentaMetodosPago from './ventaMetodosPago.svelte';

	interface Props {
		venta: Venta;
		/** Nombre de quien la registró; undefined = la columna no se muestra */
		vendedor?: string;
		mostrarVendedor?: boolean;
		onCobrar?: (venta: Venta) => void;
		onCancelar?: (venta: Venta) => void;
	}

	let { venta, vendedor, mostrarVendedor = false, onCobrar, onCancelar }: Props = $props();

	const href = $derived(resolve('/panel/ventas/historial/[id]', { id: venta.id }));
	const cancelada = $derived(venta.estado === VENTA_ESTADO.CANCELADA);
	const creada = $derived(formatDateTimeParts(venta.created_at));

	// La fila entera abre el detalle; el número es el enlace accesible
	function handleClick(event: MouseEvent) {
		if ((event.target as HTMLElement).closest('a, button, [role="menu"]')) return;
		goto(href);
	}
</script>

<TableRow
	onclick={handleClick}
	class="cursor-pointer border-light-one_d hover:bg-light-one_d/50 dark:border-dark-one_d dark:hover:bg-dark-one_d/50"
>
	<TableCell class="px-4 py-3">
		<a {href} class="font-semibold text-light-two tabular-nums hover:underline dark:text-dark-two">
			{formatVentaNumero(venta.numero)}
		</a>
	</TableCell>
	<TableCell class="px-4 py-3 text-sm">
		<time datetime={venta.created_at} class="block whitespace-nowrap">
			<span class="block text-light-two dark:text-dark-two">{creada.fecha}</span>
			<span class="block text-xs text-light-two_d dark:text-dark-two_d">{creada.hora}</span>
		</time>
	</TableCell>
	<TableCell class="px-4 py-3 text-sm">
		<p class="truncate text-light-two dark:text-dark-two">{formatValue(venta.referencia)}</p>
		{#if venta.cliente_telefono}
			<p class="truncate text-xs text-light-two_d dark:text-dark-two_d">{venta.cliente_telefono}</p>
		{/if}
	</TableCell>
	<TableCell class="hidden px-4 py-3 text-sm lg:table-cell">
		<VentaCanal canal={venta.canal} />
	</TableCell>
	<TableCell class="hidden px-4 py-3 text-sm lg:table-cell">
		<VentaMetodosPago metodos={venta.metodos_pago} />
	</TableCell>
	{#if mostrarVendedor}
		<TableCell
			class="hidden truncate px-4 py-3 text-sm text-light-two_d xl:table-cell dark:text-dark-two_d"
		>
			{formatValue(vendedor)}
		</TableCell>
	{/if}
	<TableCell class="px-4 py-3">
		<VentaEstadoBadge estado={venta.estado} size="sm" />
	</TableCell>
	<TableCell
		class={[
			'px-4 py-3 text-right font-semibold whitespace-nowrap tabular-nums',
			cancelada
				? 'text-light-two_d line-through dark:text-dark-two_d'
				: 'text-light-two dark:text-dark-two'
		].join(' ')}
	>
		{formatCurrency(venta.total)}
	</TableCell>
	<TableCell class="px-2 py-3 text-right">
		<VentaActions {venta} {onCobrar} {onCancelar} />
	</TableCell>
</TableRow>
