<script lang="ts">
	import { TableCell, TableRow } from '#lib/components/ui/index.ts';
	import type { MovimientoInventario, SkuNombre } from '#lib/interfaces/index.ts';
	import {
		formatCurrency,
		formatDateTime,
		formatNumber,
		formatValue,
		formatVentaNumero
	} from '#lib/utils/index.ts';
	import KardexCantidad from './kardexCantidad.svelte';
	import KardexSku from './kardexSku.svelte';
	import KardexTipoBadge from './kardexTipoBadge.svelte';

	interface Props {
		movimiento: MovimientoInventario;
		/** Nombre del SKU; undefined = no está en el catálogo */
		sku?: SkuNombre;
		/** Nombre de quien lo originó */
		usuario?: string;
		/** false en el kardex de un SKU: todas las filas son del mismo */
		mostrarSku?: boolean;
		mostrarUsuario?: boolean;
		onSelect: (movimiento: MovimientoInventario) => void;
	}

	let {
		movimiento,
		sku,
		usuario,
		mostrarSku = true,
		mostrarUsuario = false,
		onSelect
	}: Props = $props();

	const referencia = $derived(
		movimiento.venta ? `Venta ${formatVentaNumero(movimiento.venta.numero)}` : movimiento.motivo
	);

	// La fila entera abre el detalle; la fecha es el botón accesible
	function handleClick(event: MouseEvent) {
		if ((event.target as HTMLElement).closest('a, button')) return;
		onSelect(movimiento);
	}
</script>

<TableRow
	onclick={handleClick}
	class="cursor-pointer border-light-one_d hover:bg-light-one_d/50 dark:border-dark-one_d dark:hover:bg-dark-one_d/50"
>
	<TableCell class="px-4 py-3 text-sm whitespace-nowrap">
		<button
			type="button"
			onclick={() => onSelect(movimiento)}
			class="text-left text-light-two hover:underline dark:text-dark-two"
		>
			{formatDateTime(movimiento.created_at)}
		</button>
	</TableCell>
	{#if mostrarSku}
		<TableCell class="px-4 py-3 text-sm">
			<KardexSku {sku} codigoBarras={movimiento.sku?.codigo_barras} />
		</TableCell>
	{/if}
	<TableCell class="px-4 py-3 text-sm">
		<KardexTipoBadge tipo={movimiento.tipo} size="sm" />
		{#if referencia}
			<p class="mt-1 truncate text-xs text-light-two_d dark:text-dark-two_d" title={referencia}>
				{referencia}
			</p>
		{/if}
	</TableCell>
	<TableCell class="px-4 py-3 text-right text-sm">
		<KardexCantidad cantidad={movimiento.cantidad} />
	</TableCell>
	<TableCell
		class="px-4 py-3 text-right text-sm font-semibold text-light-two tabular-nums dark:text-dark-two"
	>
		{formatNumber(movimiento.saldo)}
	</TableCell>
	<TableCell
		class="hidden px-4 py-3 text-right text-sm whitespace-nowrap text-light-two_d tabular-nums lg:table-cell dark:text-dark-two_d"
	>
		{formatCurrency(movimiento.costo_unitario)}
	</TableCell>
	<TableCell
		class="hidden px-4 py-3 text-right text-sm whitespace-nowrap text-light-two_d tabular-nums xl:table-cell dark:text-dark-two_d"
	>
		{formatCurrency(movimiento.costo_promedio)}
	</TableCell>
	{#if mostrarUsuario}
		<TableCell
			class="hidden truncate px-4 py-3 text-sm text-light-two_d 2xl:table-cell dark:text-dark-two_d"
		>
			{formatValue(usuario)}
		</TableCell>
	{/if}
</TableRow>
