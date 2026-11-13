<script lang="ts">
	import { Button } from '#lib/components/ui/index.ts';
	import { XIcon } from '#lib/icons/outline/index.ts';
	import type { MovimientoInventario, SkuNombre } from '#lib/interfaces/index.ts';
	import { formatCurrency, formatNumber } from '#lib/utils/index.ts';
	import KardexSku from './kardexSku.svelte';

	/** Cabecera del kardex de un SKU: qué prenda es, cómo quedó y cómo volver a todas */
	interface Props {
		/** null mientras no se conoce (p. ej. se abrió desde la URL y aún no hay movimientos) */
		sku: SkuNombre | null;
		/**
		 * Su último movimiento, solo si la vista no está recortada por fecha, tipo, motivo o
		 * responsable: su saldo es el stock de hoy. null = no se muestran los totales.
		 */
		ultimo: MovimientoInventario | null;
		onClear: () => void;
	}

	let { sku, ultimo, onClear }: Props = $props();

	const labelClass = 'text-xs font-medium text-light-two_d dark:text-dark-two_d';
	const valueClass = 'text-lg font-semibold text-light-two tabular-nums dark:text-dark-two';
</script>

<section
	aria-label="Kardex de la prenda"
	class="flex flex-col gap-4 border border-light-one_d bg-light-one p-4 lg:flex-row lg:items-center dark:border-dark-one_d dark:bg-dark-one"
>
	<div class="min-w-0 flex-1">
		<p class="mb-1 {labelClass}">Kardex de</p>
		{#if sku}
			<KardexSku {sku} mostrarCodigo />
		{:else}
			<p class="font-medium text-light-two_d dark:text-dark-two_d">Prenda seleccionada</p>
		{/if}
	</div>
	{#if ultimo}
		<dl class="grid grid-cols-3 gap-4 lg:text-right">
			<div>
				<dt class={labelClass}>Stock</dt>
				<dd class={valueClass}>{formatNumber(ultimo.saldo)}</dd>
			</div>
			<div>
				<dt class={labelClass}>Costo prom.</dt>
				<dd class={valueClass}>{formatCurrency(ultimo.costo_promedio)}</dd>
			</div>
			<div>
				<dt class={labelClass}>Valor</dt>
				<dd class={valueClass}>{formatCurrency(ultimo.saldo_valor)}</dd>
			</div>
		</dl>
	{/if}
	<Button variant="outline" size="sm" onclick={onClear} class="w-full lg:w-auto">
		{#snippet leftIcon()}<XIcon class="size-4" />{/snippet}
		Ver todas las prendas
	</Button>
</section>
