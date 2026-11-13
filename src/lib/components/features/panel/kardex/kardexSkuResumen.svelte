<script lang="ts">
	import { Button } from '#lib/components/ui/index.ts';
	import { XIcon } from '#lib/icons/outline/index.ts';
	import type { ProductoStock, SkuNombre } from '#lib/interfaces/index.ts';
	import { formatNumber } from '#lib/utils/index.ts';
	import KardexSku from './kardexSku.svelte';

	/** Cabecera del kardex de un SKU: qué SKU es, su stock de hoy y cómo volver a todos */
	interface Props {
		sku: SkuNombre | undefined;
		/** Código del SKU por si ya no está en el catálogo */
		codigoBarras?: string | null;
		/** Stock de hoy (viene en cada movimiento); null mientras no hay movimientos cargados */
		stock: ProductoStock | null;
		onClear: () => void;
	}

	let { sku, codigoBarras = null, stock, onClear }: Props = $props();

	const bajoMinimo = $derived(!!stock && stock.cantidad <= stock.minimo);
</script>

<section
	aria-label="Kardex del SKU"
	class="flex flex-col gap-3 border border-light-one_d bg-light-one p-4 sm:flex-row sm:items-center dark:border-dark-one_d dark:bg-dark-one"
>
	<div class="min-w-0 flex-1">
		<p class="mb-1 text-xs font-medium text-light-two_d dark:text-dark-two_d">Kardex de</p>
		<KardexSku {sku} {codigoBarras} mostrarCodigo />
	</div>
	{#if stock}
		<div class="sm:text-right">
			<p class="text-xs font-medium text-light-two_d dark:text-dark-two_d">Stock actual</p>
			<p class="text-lg font-semibold text-light-two tabular-nums dark:text-dark-two">
				{formatNumber(stock.cantidad)}
				<span
					class={[
						'text-xs font-normal',
						bajoMinimo
							? 'text-light-error dark:text-dark-error'
							: 'text-light-two_d dark:text-dark-two_d'
					]}
				>
					(mínimo {formatNumber(stock.minimo)})
				</span>
			</p>
		</div>
	{/if}
	<Button variant="outline" size="sm" onclick={onClear} class="w-full sm:w-auto">
		{#snippet leftIcon()}<XIcon class="size-4" />{/snippet}
		Ver todos los SKUs
	</Button>
</section>
