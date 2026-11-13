<script lang="ts">
	import { resolve } from '$app/paths';
	import { Button, Sheet } from '#lib/components/ui/index.ts';
	import { VentaEstadoBadge } from '#lib/components/features/panel/ventas/index.ts';
	import { VENTA_CANAL_LABEL } from '#lib/constants/index.ts';
	import { ArrowUpRightIcon, ListIcon } from '#lib/icons/outline/index.ts';
	import type { MovimientoInventario, SkuNombre } from '#lib/interfaces/index.ts';
	import {
		formatCurrency,
		formatDateTime,
		formatNumber,
		formatValue,
		formatVentaNumero,
		valorMovimiento
	} from '#lib/utils/index.ts';
	import KardexCantidad from './kardexCantidad.svelte';
	import KardexSku from './kardexSku.svelte';
	import KardexTipoBadge from './kardexTipoBadge.svelte';

	/** Detalle de un movimiento (null = cerrado). Los movimientos no se editan: solo se consultan */
	interface Props {
		movimiento: MovimientoInventario | null;
		sku?: SkuNombre;
		usuario?: string;
		onClose: () => void;
		/** Abre el kardex del SKU del movimiento; undefined = ya se está viendo */
		onVerKardex?: (skuId: string) => void;
	}

	let { movimiento, sku, usuario, onClose, onVerKardex }: Props = $props();

	// Se conserva el último para que el contenido no desaparezca mientras se cierra
	let actual = $state<MovimientoInventario | null>(null);
	$effect(() => {
		if (movimiento) actual = movimiento;
	});

	const valor = $derived(actual ? valorMovimiento(actual) : null);

	const dtClass = 'text-light-two_d dark:text-dark-two_d';
	const ddClass = 'text-right text-light-two dark:text-dark-two';
	const statLabel = 'text-xs font-medium text-light-two_d dark:text-dark-two_d';
	const statValue = 'mt-0.5 text-base font-semibold text-light-two tabular-nums dark:text-dark-two';
</script>

<Sheet
	open={!!movimiento}
	title="Movimiento de inventario"
	description={actual ? formatDateTime(actual.created_at) : undefined}
	{onClose}
	footer={onVerKardex ? verKardex : undefined}
>
	{#if actual}
		<div class="space-y-5">
			<div class="flex items-start justify-between gap-3">
				<KardexSku {sku} codigoBarras={actual.sku?.codigo_barras} mostrarCodigo class="text-sm" />
				<KardexTipoBadge tipo={actual.tipo} />
			</div>

			<div
				class="grid grid-cols-2 gap-px border border-light-one_d bg-light-one_d dark:border-dark-one_d dark:bg-dark-one_d"
			>
				<div class="bg-light-one p-3 dark:bg-dark-one">
					<p class={statLabel}>Cantidad</p>
					<KardexCantidad cantidad={actual.cantidad} class="mt-0.5 block text-base" />
				</div>
				<div class="bg-light-one p-3 dark:bg-dark-one">
					<p class={statLabel}>Saldo</p>
					<p class={statValue}>{formatNumber(actual.saldo)}</p>
				</div>
				<div class="bg-light-one p-3 dark:bg-dark-one">
					<p class={statLabel}>Costo unitario</p>
					<p class={statValue}>{formatCurrency(actual.costo_unitario)}</p>
				</div>
				<div class="bg-light-one p-3 dark:bg-dark-one">
					<p class={statLabel}>Costo promedio</p>
					<p class={statValue}>{formatCurrency(actual.costo_promedio)}</p>
				</div>
			</div>

			<dl class="space-y-2 text-sm">
				<div class="flex justify-between gap-4">
					<dt class={dtClass}>Valor del movimiento</dt>
					<dd class="{ddClass} tabular-nums">{formatCurrency(valor)}</dd>
				</div>
				<div class="flex justify-between gap-4">
					<dt class={dtClass}>Motivo</dt>
					<dd class={ddClass}>{formatValue(actual.motivo)}</dd>
				</div>
				{#if usuario}
					<div class="flex justify-between gap-4">
						<dt class={dtClass}>Registrado por</dt>
						<dd class={ddClass}>{usuario}</dd>
					</div>
				{/if}
				{#if actual.sku}
					<div class="flex justify-between gap-4">
						<dt class={dtClass}>Stock actual del SKU</dt>
						<dd class="{ddClass} tabular-nums">{formatNumber(actual.sku.stock.cantidad)}</dd>
					</div>
				{/if}
			</dl>

			{#if actual.venta}
				{@const venta = actual.venta}
				<section class="border border-light-one_d dark:border-dark-one_d" aria-label="Venta">
					<header
						class="flex items-center justify-between gap-3 border-b border-light-one_d px-4 py-2.5 dark:border-dark-one_d"
					>
						<a
							href={resolve('/panel/ventas/historial/[id]', { id: venta.id })}
							class="inline-flex items-center gap-1 text-sm font-semibold text-light-two hover:underline dark:text-dark-two"
						>
							Venta {formatVentaNumero(venta.numero)}
							<ArrowUpRightIcon class="size-4" />
						</a>
						<VentaEstadoBadge estado={venta.estado} size="sm" />
					</header>
					<dl class="space-y-2 px-4 py-3 text-sm">
						<div class="flex justify-between gap-4">
							<dt class={dtClass}>Cliente</dt>
							<dd class={ddClass}>{formatValue(venta.referencia)}</dd>
						</div>
						<div class="flex justify-between gap-4">
							<dt class={dtClass}>Canal</dt>
							<dd class={ddClass}>{VENTA_CANAL_LABEL[venta.canal]}</dd>
						</div>
						<div class="flex justify-between gap-4">
							<dt class={dtClass}>Total</dt>
							<dd class="{ddClass} font-semibold tabular-nums">{formatCurrency(venta.total)}</dd>
						</div>
					</dl>
				</section>
			{/if}
		</div>
	{/if}
</Sheet>

{#snippet verKardex()}
	{#if actual && onVerKardex}
		{@const skuId = actual.sku_id}
		<Button variant="outline" class="w-full" onclick={() => onVerKardex(skuId)}>
			{#snippet leftIcon()}<ListIcon class="size-5" />{/snippet}
			Ver kardex de este SKU
		</Button>
	{/if}
{/snippet}
