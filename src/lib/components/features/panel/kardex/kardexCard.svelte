<script lang="ts">
	import type { MovimientoInventario, SkuNombre } from '#lib/interfaces/index.ts';
	import { formatDateTime, formatNumber, formatVentaNumero } from '#lib/utils/index.ts';
	import KardexCantidad from './kardexCantidad.svelte';
	import KardexSku from './kardexSku.svelte';
	import KardexTipoBadge from './kardexTipoBadge.svelte';

	interface Props {
		movimiento: MovimientoInventario;
		sku?: SkuNombre;
		usuario?: string;
		/** false en el kardex de un SKU */
		mostrarSku?: boolean;
		onSelect: (movimiento: MovimientoInventario) => void;
	}

	let { movimiento, sku, usuario, mostrarSku = true, onSelect }: Props = $props();

	const referencia = $derived(
		movimiento.venta ? `Venta ${formatVentaNumero(movimiento.venta.numero)}` : movimiento.motivo
	);
</script>

<!-- Toda la tarjeta abre el detalle -->
<button
	type="button"
	onclick={() => onSelect(movimiento)}
	class="flex w-full gap-3 border border-light-one_d bg-light-one p-4 text-left transition-colors hover:border-light-four focus-visible:ring-2 focus-visible:ring-light-three/40 focus-visible:outline-none dark:border-dark-one_d dark:bg-dark-one dark:hover:border-dark-four_d dark:focus-visible:ring-dark-three/40"
>
	<div class="min-w-0 flex-1 space-y-2">
		{#if mostrarSku}
			<KardexSku {sku} codigoBarras={movimiento.sku?.codigo_barras} class="text-sm" />
		{/if}
		<div class="flex items-center gap-2">
			<KardexTipoBadge tipo={movimiento.tipo} size="sm" />
			{#if referencia}
				<span class="truncate text-xs text-light-two_d dark:text-dark-two_d">{referencia}</span>
			{/if}
		</div>
		<p class="text-xs text-light-two_d dark:text-dark-two_d">
			{formatDateTime(movimiento.created_at)}{usuario ? ` · ${usuario}` : ''}
		</p>
	</div>
	<div class="flex shrink-0 flex-col items-end justify-between gap-2">
		<KardexCantidad cantidad={movimiento.cantidad} class="text-lg" />
		<p class="text-xs text-light-two_d dark:text-dark-two_d">
			Saldo
			<span class="font-semibold text-light-two tabular-nums dark:text-dark-two">
				{formatNumber(movimiento.saldo)}
			</span>
		</p>
	</div>
</button>
