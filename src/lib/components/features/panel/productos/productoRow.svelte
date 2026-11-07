<script lang="ts">
	import { resolve } from '$app/paths';
	import { Badge, TableCell, TableRow } from '#lib/components/ui/index.ts';
	import type { Producto } from '#lib/interfaces/index.ts';
	import { formatBoolean, formatDate, formatNumber, formatPriceRange } from '#lib/utils/index.ts';
	import ProductoActions from './productoActions.svelte';
	import ProductoColores from './productoColores.svelte';
	import ProductoPortada from './productoPortada.svelte';

	interface Props {
		producto: Producto;
		onDelete?: (producto: Producto) => void;
	}

	let { producto, onDelete }: Props = $props();

	const sinStock = $derived(producto.resumen.stock_total === 0);
</script>

<TableRow
	class="border-light-one_d hover:bg-light-one_d/50 dark:border-dark-one_d dark:hover:bg-dark-one_d/50"
>
	<TableCell class="px-4 py-3">
		<div class="flex min-w-0 items-center gap-3">
			<ProductoPortada url={producto.resumen.portada_url} alt="Portada de {producto.nombre}" />
			<div class="min-w-0">
				<a
					href={resolve('/panel/productos/[id]', { id: producto.id })}
					class="block truncate font-medium text-light-two hover:underline dark:text-dark-two"
				>
					{producto.nombre}
				</a>
				<p class="truncate text-xs text-light-two_d dark:text-dark-two_d">
					{producto.seccion.nombre}
				</p>
			</div>
		</div>
	</TableCell>
	<TableCell class="px-4 py-3">
		<ProductoColores colores={producto.resumen.colores} />
	</TableCell>
	<TableCell
		class="hidden px-4 py-3 text-sm whitespace-nowrap text-light-two lg:table-cell dark:text-dark-two"
	>
		{formatPriceRange(producto.resumen.precio_desde, producto.resumen.precio_hasta)}
	</TableCell>
	<TableCell class="hidden px-4 py-3 text-sm lg:table-cell">
		{#if sinStock}
			<Badge variant="warning" size="sm">Sin stock</Badge>
		{:else}
			<span class="text-light-two dark:text-dark-two">
				{formatNumber(producto.resumen.stock_total)}
			</span>
		{/if}
	</TableCell>
	<TableCell class="px-4 py-3">
		<Badge variant={producto.is_visible ? 'success' : 'secondary'} dot>
			{formatBoolean(producto.is_visible, { trueLabel: 'Visible', falseLabel: 'Oculto' })}
		</Badge>
	</TableCell>
	<TableCell
		class="hidden px-4 py-3 text-sm whitespace-nowrap text-light-two_d xl:table-cell dark:text-dark-two_d"
	>
		{formatDate(producto.created_at)}
	</TableCell>
	<TableCell class="px-2 py-3 text-right">
		<ProductoActions {producto} {onDelete} />
	</TableCell>
</TableRow>
