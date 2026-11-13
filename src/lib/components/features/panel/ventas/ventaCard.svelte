<script lang="ts">
	import { resolve } from '$app/paths';
	import { VENTA_ESTADO } from '#lib/constants/index.ts';
	import type { Venta } from '#lib/interfaces/index.ts';
	import { formatCurrency, formatDateTime, formatVentaNumero } from '#lib/utils/index.ts';
	import VentaActions from './ventaActions.svelte';
	import VentaCanal from './ventaCanal.svelte';
	import VentaEstadoBadge from './ventaEstadoBadge.svelte';
	import VentaMetodosPago from './ventaMetodosPago.svelte';

	interface Props {
		venta: Venta;
		vendedor?: string;
		onCobrar?: (venta: Venta) => void;
		onCancelar?: (venta: Venta) => void;
	}

	let { venta, vendedor, onCobrar, onCancelar }: Props = $props();

	const cancelada = $derived(venta.estado === VENTA_ESTADO.CANCELADA);
</script>

<article
	class="relative flex gap-3 border border-light-one_d bg-light-one p-4 dark:border-dark-one_d dark:bg-dark-one"
>
	<div class="min-w-0 flex-1">
		<div class="flex items-center gap-2">
			<!-- El enlace cubre la tarjeta (::after); las acciones quedan por encima -->
			<a
				href={resolve('/panel/ventas/historial/[id]', { id: venta.id })}
				class="font-semibold text-light-two tabular-nums after:absolute after:inset-0 dark:text-dark-two"
			>
				{formatVentaNumero(venta.numero)}
			</a>
			<VentaEstadoBadge estado={venta.estado} size="sm" />
		</div>
		<p class="mt-0.5 text-xs text-light-two_d dark:text-dark-two_d">
			{formatDateTime(venta.created_at)}{vendedor ? ` · ${vendedor}` : ''}
		</p>
		{#if venta.referencia || venta.cliente_telefono}
			<p class="mt-2 truncate text-sm text-light-two dark:text-dark-two">
				{venta.referencia ?? ''}{venta.referencia && venta.cliente_telefono
					? ' · '
					: ''}{venta.cliente_telefono ?? ''}
			</p>
		{/if}
		<div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
			<VentaCanal canal={venta.canal} />
			{#if venta.metodos_pago.length > 0}
				<VentaMetodosPago metodos={venta.metodos_pago} />
			{/if}
		</div>
	</div>
	<div class="flex shrink-0 flex-col items-end justify-between">
		<div class="relative z-10 -mt-1.5 -mr-2">
			<VentaActions {venta} {onCobrar} {onCancelar} />
		</div>
		<p
			class={[
				'text-lg font-bold tabular-nums',
				cancelada
					? 'text-light-two_d line-through dark:text-dark-two_d'
					: 'text-light-two dark:text-dark-two'
			]}
		>
			{formatCurrency(venta.total)}
		</p>
	</div>
</article>
