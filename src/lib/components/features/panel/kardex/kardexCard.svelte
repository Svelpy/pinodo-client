<script lang="ts">
	import { resolve } from '$app/paths';
	import type { MovimientoInventario } from '#lib/interfaces/index.ts';
	import {
		formatCurrency,
		formatDateTime,
		formatFullName,
		formatNumber
	} from '#lib/utils/index.ts';
	import KardexCantidad from './kardexCantidad.svelte';
	import KardexOrigen from './kardexOrigen.svelte';
	import KardexSku from './kardexSku.svelte';
	import KardexTipoBadge from './kardexTipoBadge.svelte';

	interface Props {
		movimiento: MovimientoInventario;
		/** false en el kardex de un SKU */
		mostrarSku?: boolean;
	}

	let { movimiento, mostrarSku = true }: Props = $props();
</script>

<!-- Toda la tarjeta abre el detalle -->
<a
	href={resolve('/panel/kardex/movimientos/[id]', { id: movimiento.id })}
	class="flex w-full gap-3 border border-light-one_d bg-light-one text-left transition-colors hover:border-light-four focus-visible:ring-2 focus-visible:ring-light-three/40 focus-visible:outline-none dark:border-dark-one_d dark:bg-dark-one dark:hover:border-dark-four_d dark:focus-visible:ring-dark-three/40"
>
	<div class="min-w-0 flex-1 space-y-2">
		{#if mostrarSku}
			<KardexSku sku={movimiento.sku} class="text-sm" />
		{/if}
		<div class="flex min-w-0 items-center gap-2">
			<KardexTipoBadge tipo={movimiento.tipo} size="sm" />
			<KardexOrigen
				origen={movimiento.origen}
				class="truncate text-xs text-light-two_d dark:text-dark-two_d"
			/>
		</div>
		<p class="truncate text-xs text-light-two_d dark:text-dark-two_d">
			{formatDateTime(movimiento.created_at)} · {formatFullName(movimiento.usuario)}
		</p>
	</div>
	<div class="flex shrink-0 flex-col items-end justify-between gap-1">
		<KardexCantidad cantidad={movimiento.cantidad} class="text-lg" />
		<p class="text-xs text-light-two_d tabular-nums dark:text-dark-two_d">
			{formatCurrency(movimiento.costo_total)}
		</p>
		<p class="text-xs text-light-two_d dark:text-dark-two_d">
			Saldo
			<span class="font-semibold text-light-two tabular-nums dark:text-dark-two">
				{formatNumber(movimiento.saldo)}
			</span>
		</p>
	</div>
</a>
