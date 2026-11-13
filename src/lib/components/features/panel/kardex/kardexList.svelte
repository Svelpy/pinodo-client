<script lang="ts">
	import { KardexListSkeleton } from '#lib/components/skeletons/index.ts';
	import { AlertBox, Button, EmptyState, Pagination, Select } from '#lib/components/ui/index.ts';
	import { PAGINATION } from '#lib/constants/index.ts';
	import { AlertTriangleIcon, ArrowsLeftRightIcon, RefreshIcon } from '#lib/icons/outline/index.ts';
	import type { MovimientoInventario } from '#lib/interfaces/index.ts';
	import KardexCard from './kardexCard.svelte';
	import KardexTable from './kardexTable.svelte';

	interface Props {
		movimientos: MovimientoInventario[];
		/** Kardex de un solo SKU: no se repite el producto en cada fila */
		mostrarSku?: boolean;
		/** Hay filtros aplicados (cambia el mensaje de lista vacía) */
		filtrada: boolean;
		currentPage: number;
		totalPages: number;
		perPage: number;
		total: number;
		isLoading?: boolean;
		error?: string;
		onPageChange: (page: number) => void;
		onPerPageChange?: (perPage: number) => void;
		onRetry?: () => void;
	}

	let {
		movimientos,
		mostrarSku = true,
		filtrada,
		currentPage,
		totalPages,
		perPage,
		total,
		isLoading = false,
		error = '',
		onPageChange,
		onPerPageChange,
		onRetry
	}: Props = $props();

	const hasData = $derived(movimientos.length > 0);
	const isInitialLoading = $derived(isLoading && !hasData);
</script>

<section
	aria-busy={isLoading}
	class="overflow-hidden border border-light-one_d bg-light-one dark:border-dark-one_d dark:bg-dark-one"
>
	{#if error && !hasData}
		<EmptyState
			icon={AlertTriangleIcon}
			title="No se pudieron cargar los movimientos"
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
		<KardexListSkeleton {mostrarSku} />
	{:else if !hasData}
		<EmptyState
			icon={ArrowsLeftRightIcon}
			title={filtrada ? 'No hay movimientos con estos filtros' : 'Todavía no hay movimientos'}
			description={filtrada
				? 'Prueba con otro rango de fechas o quita algún filtro.'
				: 'Los ajustes de stock, las ventas cobradas y sus anulaciones aparecerán aquí.'}
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
			<div class="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 md:hidden">
				{#each movimientos as movimiento (movimiento.id)}
					<KardexCard {movimiento} {mostrarSku} />
				{/each}
			</div>

			<!-- Tablet y escritorio: tabla -->
			<div class="hidden md:block">
				<KardexTable {movimientos} {mostrarSku} />
			</div>
		</div>

		<div
			class="flex flex-col-reverse border-t border-light-one_d md:flex-row md:items-center dark:border-dark-one_d"
		>
			{#if onPerPageChange}
				<div
					class="flex items-center justify-center gap-2 px-4 pb-3 text-sm text-light-two_d md:pt-3 md:pr-0 md:pl-6 dark:text-dark-two_d"
				>
					<label for="kardex-per-page" class="whitespace-nowrap">Mostrar</label>
					<Select
						id="kardex-per-page"
						value={perPage}
						onchange={(event) => onPerPageChange(Number(event.currentTarget.value))}
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
