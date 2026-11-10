<script lang="ts">
	import { ProductoListSkeleton } from '#lib/components/skeletons/index.ts';
	import { AlertBox, Button, EmptyState, Pagination, Select } from '#lib/components/ui/index.ts';
	import { PAGINATION } from '#lib/constants/index.ts';
	import { AlertTriangleIcon, PackageIcon, RefreshIcon } from '#lib/icons/outline/index.ts';
	import type { Producto } from '#lib/interfaces/index.ts';
	import ProductoCard from './productoCard.svelte';
	import ProductoTable from './productoTable.svelte';

	interface Props {
		productos: Producto[];
		/** Hay algún filtro o búsqueda activa: cambia el mensaje de lista vacía */
		hasFilters: boolean;
		currentPage: number;
		totalPages: number;
		perPage: number;
		total: number;
		isLoading?: boolean;
		error?: string;
		onPageChange: (page: number) => void;
		onPerPageChange?: (perPage: number) => void;
		onRetry?: () => void;
		/** Opcionales: sin handler (según permisos) la opción correspondiente no se muestra */
		onToggleVisible?: (producto: Producto) => void;
		onDelete?: (producto: Producto) => void;
	}

	let {
		productos,
		hasFilters,
		currentPage,
		totalPages,
		perPage,
		total,
		isLoading = false,
		error = '',
		onPageChange,
		onPerPageChange,
		onRetry,
		onToggleVisible,
		onDelete
	}: Props = $props();

	function handlePerPageChange(event: Event & { currentTarget: HTMLSelectElement }) {
		onPerPageChange?.(Number(event.currentTarget.value));
	}

	const hasData = $derived(productos.length > 0);
	// Primera carga: sin datos previos que mostrar mientras llega la respuesta
	const isInitialLoading = $derived(isLoading && !hasData);
</script>

<section
	aria-busy={isLoading}
	class="overflow-hidden border border-light-one_d bg-light-one dark:border-dark-one_d dark:bg-dark-one"
>
	{#if error && !hasData}
		<EmptyState
			icon={AlertTriangleIcon}
			title="No se pudieron cargar los productos"
			description={error}
		>
			{#if onRetry}
				<Button variant="outline" size="sm" onclick={onRetry}>
					{#snippet leftIcon()}<RefreshIcon class="size-4" />{/snippet}
					Reintentar
				</Button>
			{/if}
		</EmptyState>
	{:else if isInitialLoading}
		<ProductoListSkeleton />
	{:else if !hasData}
		<EmptyState
			icon={PackageIcon}
			title={hasFilters ? 'No hay productos con estos filtros' : 'No hay productos registrados'}
			description={hasFilters
				? 'Prueba con otra combinación de filtros o de búsqueda.'
				: 'Cuando se creen productos aparecerán aquí.'}
		/>
	{:else}
		{#if error}
			<AlertBox class="border-0 border-b">
				{error}
				{#snippet action()}
					{#if onRetry}
						<button
							type="button"
							onclick={onRetry}
							class="font-medium underline underline-offset-2"
						>
							Reintentar
						</button>
					{/if}
				{/snippet}
			</AlertBox>
		{/if}

		<div class={['transition-opacity', isLoading && 'pointer-events-none opacity-60']}>
			<!-- Móvil y tablet pequeña: tarjetas -->
			<div class="grid gap-3 p-3 sm:grid-cols-2 md:hidden">
				{#each productos as producto (producto.id)}
					<ProductoCard {producto} {onToggleVisible} {onDelete} />
				{/each}
			</div>

			<!-- Tablet y escritorio: tabla -->
			<div class="hidden md:block">
				<ProductoTable {productos} {onToggleVisible} {onDelete} />
			</div>
		</div>

		<div
			class="flex flex-col-reverse border-t border-light-one_d md:flex-row md:items-center dark:border-dark-one_d"
		>
			{#if onPerPageChange}
				<div
					class="flex items-center justify-center gap-2 px-4 pb-3 text-sm text-light-two_d md:pt-3 md:pr-0 md:pl-6 dark:text-dark-two_d"
				>
					<label for="productos-per-page" class="whitespace-nowrap">Mostrar</label>
					<Select
						id="productos-per-page"
						value={perPage}
						onchange={handlePerPageChange}
						disabled={isLoading}
						class="w-20"
					>
						{#each PAGINATION.PER_PAGE_OPTIONS as option (option)}
							<option value={option}>{option}</option>
						{/each}
					</Select>
					<span class="whitespace-nowrap">por página</span>
				</div>
			{/if}

			<div class="min-w-0 flex-1">
				<Pagination {currentPage} {totalPages} {perPage} {total} {onPageChange} />
			</div>
		</div>
	{/if}
</section>
