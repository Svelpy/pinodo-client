<script lang="ts">
	import { VentaCatalogoSkeleton } from '#lib/components/skeletons/index.ts';
	import { Button, EmptyState } from '#lib/components/ui/index.ts';
	import { AlertTriangleIcon, PackageIcon, RefreshIcon } from '#lib/icons/outline/index.ts';
	import type { SkuInventario } from '#lib/interfaces/index.ts';
	import { agruparInventario, formatNumber } from '#lib/utils/index.ts';
	import VentaProductoCard from './ventaProductoCard.svelte';

	interface Props {
		skus: SkuInventario[];
		/** Total de SKUs que coinciden con la búsqueda */
		total: number;
		enCarrito: ReadonlyMap<string, number>;
		/** Búsqueda aplicada, para el mensaje de lista vacía */
		busqueda: string;
		isLoading?: boolean;
		error?: string;
		hasMore?: boolean;
		onLoadMore?: () => void;
		onRetry?: () => void;
		onAdd: (sku: SkuInventario) => void;
		disabled?: boolean;
	}

	let {
		skus,
		total,
		enCarrito,
		busqueda,
		isLoading = false,
		error = '',
		hasMore = false,
		onLoadMore,
		onRetry,
		onAdd,
		disabled = false
	}: Props = $props();

	const productos = $derived(agruparInventario(skus));
	const hasData = $derived(skus.length > 0);
</script>

<section aria-label="Productos" aria-busy={isLoading} class="space-y-3">
	{#if error && !hasData}
		<div class="border border-light-one_d dark:border-dark-one_d">
			<EmptyState
				icon={AlertTriangleIcon}
				title="No se pudo cargar el inventario"
				description={error}
			>
				{#if onRetry}
					<Button variant="outline" size="sm" onclick={onRetry}>
						{#snippet leftIcon()}<RefreshIcon class="size-4" />{/snippet}
						Reintentar
					</Button>
				{/if}
			</EmptyState>
		</div>
	{:else if isLoading && !hasData}
		<VentaCatalogoSkeleton />
	{:else if !hasData}
		<div class="border border-light-one_d dark:border-dark-one_d">
			<EmptyState
				icon={PackageIcon}
				title={busqueda ? `Sin resultados para «${busqueda}»` : 'No hay productos en el inventario'}
				description={busqueda
					? 'Revisa el nombre o escanea el código de la etiqueta.'
					: 'Cuando registres productos con tallas aparecerán aquí para vender.'}
			/>
		</div>
	{:else}
		<p class="text-xs text-light-two_d dark:text-dark-two_d">
			{formatNumber(total)}
			{total === 1 ? 'variante' : 'variantes'}{busqueda ? ` para «${busqueda}»` : ''}
		</p>
		<div
			class={[
				'grid gap-3 transition-opacity sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2',
				isLoading && 'opacity-60'
			]}
		>
			{#each productos as producto (producto.producto_id)}
				<VentaProductoCard {producto} {enCarrito} {onAdd} {disabled} />
			{/each}
		</div>
		{#if error}
			<p role="alert" class="text-sm text-light-error dark:text-dark-error">{error}</p>
		{/if}
		{#if hasMore && onLoadMore}
			<div class="flex justify-center">
				<Button variant="outline" loading={isLoading} onclick={onLoadMore}>Cargar más</Button>
			</div>
		{/if}
	{/if}
</section>
