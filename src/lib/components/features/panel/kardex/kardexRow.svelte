<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { TableCell, TableRow } from '#lib/components/ui/index.ts';
	import type { MovimientoInventario } from '#lib/interfaces/index.ts';
	import {
		formatCurrency,
		formatDateTimeParts,
		formatFullName,
		formatNumber
	} from '#lib/utils/index.ts';
	import KardexCantidad from './kardexCantidad.svelte';
	import KardexOrigen from './kardexOrigen.svelte';
	import KardexSku from './kardexSku.svelte';
	import KardexTipoBadge from './kardexTipoBadge.svelte';

	interface Props {
		movimiento: MovimientoInventario;
		/** false en el kardex de un SKU: todas las filas son del mismo */
		mostrarSku?: boolean;
	}

	let { movimiento, mostrarSku = true }: Props = $props();

	const href = $derived(resolve('/panel/kardex/movimientos/[id]', { id: movimiento.id }));

	// La fila entera abre el detalle; la fecha es el enlace accesible
	function handleClick(event: MouseEvent) {
		if ((event.target as HTMLElement).closest('a, button')) return;
		goto(href);
	}

	const creado = $derived(formatDateTimeParts(movimiento.created_at));

	const money = 'px-4 py-3 text-right text-sm whitespace-nowrap tabular-nums';
</script>

<TableRow
	onclick={handleClick}
	class="cursor-pointer border-light-one_d hover:bg-light-one_d/50 dark:border-dark-one_d dark:hover:bg-dark-one_d/50"
>
	<TableCell class="px-4 py-3 text-sm">
		<a {href} class="block whitespace-nowrap hover:underline">
			<time datetime={movimiento.created_at}>
				<span class="block text-light-two dark:text-dark-two">{creado.fecha}</span>
				<span class="block text-xs text-light-two_d dark:text-dark-two_d">{creado.hora}</span>
			</time>
		</a>
		<p class="truncate text-xs text-light-two_d dark:text-dark-two_d">
			{formatFullName(movimiento.usuario)}
		</p>
	</TableCell>
	{#if mostrarSku}
		<TableCell class="px-4 py-3 text-sm">
			<KardexSku sku={movimiento.sku} />
		</TableCell>
	{/if}
	<TableCell class="px-4 py-3 text-sm">
		<KardexTipoBadge tipo={movimiento.tipo} size="sm" />
		<KardexOrigen
			origen={movimiento.origen}
			class="mt-1 block truncate text-xs text-light-two_d dark:text-dark-two_d"
		/>
	</TableCell>
	<TableCell class="px-4 py-3 text-right text-sm">
		<KardexCantidad cantidad={movimiento.cantidad} />
	</TableCell>
	<TableCell
		class="px-4 py-3 text-right text-sm font-semibold text-light-two tabular-nums dark:text-dark-two"
	>
		{formatNumber(movimiento.saldo)}
	</TableCell>
	<TableCell class="{money} hidden text-light-two_d lg:table-cell dark:text-dark-two_d">
		{formatCurrency(movimiento.costo_unitario)}
	</TableCell>
	<TableCell class="{money} hidden text-light-two lg:table-cell dark:text-dark-two">
		{formatCurrency(movimiento.costo_total)}
	</TableCell>
	<TableCell class="{money} hidden text-light-two_d xl:table-cell dark:text-dark-two_d">
		{formatCurrency(movimiento.costo_promedio)}
	</TableCell>
	<TableCell class="{money} hidden font-semibold text-light-two xl:table-cell dark:text-dark-two">
		{formatCurrency(movimiento.saldo_valor)}
	</TableCell>
</TableRow>
