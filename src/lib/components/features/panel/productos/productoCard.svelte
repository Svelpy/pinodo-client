<script lang="ts">
	import { resolve } from '$app/paths';
	import { Badge } from '#lib/components/ui/index.ts';
	import type { Producto } from '#lib/interfaces/index.ts';
	import { formatBoolean, formatDate, formatNumber, formatPriceRange } from '#lib/utils/index.ts';
	import ProductoActions from './productoActions.svelte';
	import ProductoColores from './productoColores.svelte';
	import ProductoPortada from './productoPortada.svelte';

	interface Props {
		producto: Producto;
		onToggleVisible?: (producto: Producto) => void;
		onDelete?: (producto: Producto) => void;
	}

	let { producto, onToggleVisible, onDelete }: Props = $props();

	const sinStock = $derived(producto.resumen.stock_total === 0);
</script>

<article
	class="flex gap-3 border border-light-one_d bg-light-one p-4 dark:border-dark-one_d dark:bg-dark-one"
>
	<ProductoPortada
		url={producto.resumen.portada_url}
		alt="Portada de {producto.nombre}"
		class="size-16"
	/>
	<div class="min-w-0 flex-1">
		<h3 class="truncate font-semibold text-light-two dark:text-dark-two">
			<a href={resolve('/panel/productos/[id]', { id: producto.id })} class="hover:underline">
				{producto.nombre}
			</a>
		</h3>
		<p class="truncate text-xs text-light-two_d dark:text-dark-two_d">{producto.seccion.nombre}</p>

		<div class="mt-2 flex items-center gap-3 text-sm">
			<ProductoColores colores={producto.resumen.colores} max={4} />
			<span class="font-medium text-light-two dark:text-dark-two">
				{formatPriceRange(producto.resumen.precio_desde, producto.resumen.precio_hasta)}
			</span>
		</div>

		<div class="mt-2 flex flex-wrap items-center gap-2">
			<Badge variant={producto.is_visible ? 'success' : 'secondary'} dot>
				{formatBoolean(producto.is_visible, { trueLabel: 'Visible', falseLabel: 'Oculto' })}
			</Badge>
			{#if sinStock}
				<Badge variant="warning" size="sm">Sin stock</Badge>
			{:else}
				<span class="text-xs text-light-two_d dark:text-dark-two_d">
					Stock: {formatNumber(producto.resumen.stock_total)}
				</span>
			{/if}
		</div>
		<p class="mt-2 text-xs text-light-two_d dark:text-dark-two_d">
			Creado el {formatDate(producto.created_at)}
		</p>
	</div>
	<div class="-mt-1.5 -mr-2 shrink-0 self-start">
		<ProductoActions {producto} {onToggleVisible} {onDelete} />
	</div>
</article>
