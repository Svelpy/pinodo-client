<script lang="ts">
	import { VentaListSkeleton } from '#lib/components/skeletons/index.ts';
	import { AlertBox, Button, EmptyState, Pagination, Select } from '#lib/components/ui/index.ts';
	import { PAGINATION } from '#lib/constants/index.ts';
	import { AlertTriangleIcon, RefreshIcon, ShoppingCartIcon } from '#lib/icons/outline/index.ts';
	import type { Venta } from '#lib/interfaces/index.ts';
	import VentaCard from './ventaCard.svelte';
	import VentaTable from './ventaTable.svelte';

	interface Props {
		ventas: Venta[];
		/** Id de usuario → nombre; null = no se muestra quién la registró */
		vendedores: ReadonlyMap<string, string> | null;
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
		onCobrar?: (venta: Venta) => void;
		onCancelar?: (venta: Venta) => void;
	}

	let {
		ventas,
		vendedores,
		filtrada,
		currentPage,
		totalPages,
		perPage,
		total,
		isLoading = false,
		error = '',
		onPageChange,
		onPerPageChange,
		onRetry,
		onCobrar,
		onCancelar
	}: Props = $props();

	const hasData = $derived(ventas.length > 0);
	const isInitialLoading = $derived(isLoading && !hasData);
</script>

<section
	aria-busy={isLoading}
	class="overflow-hidden border border-light-one_d bg-light-one dark:border-dark-one_d dark:bg-dark-one"
>
	{#if error && !hasData}
		<EmptyState
			icon={AlertTriangleIcon}
			title="No se pudieron cargar las ventas"
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
		<VentaListSkeleton />
	{:else if !hasData}
		<EmptyState
			icon={ShoppingCartIcon}
			title={filtrada ? 'No hay ventas con estos filtros' : 'Todavía no hay ventas'}
			description={filtrada
				? 'Prueba con otro rango de fechas o quita algún filtro.'
				: 'Las ventas y pedidos que registres en la caja aparecerán aquí.'}
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
				{#each ventas as venta (venta.id)}
					<VentaCard {venta} vendedor={vendedores?.get(venta.created_by)} {onCobrar} {onCancelar} />
				{/each}
			</div>

			<!-- Tablet y escritorio: tabla -->
			<div class="hidden md:block">
				<VentaTable {ventas} {vendedores} {onCobrar} {onCancelar} />
			</div>
		</div>

		<div
			class="flex flex-col-reverse border-t border-light-one_d md:flex-row md:items-center dark:border-dark-one_d"
		>
			{#if onPerPageChange}
				<div
					class="flex items-center justify-center gap-2 px-4 pb-3 text-sm text-light-two_d md:pt-3 md:pr-0 md:pl-6 dark:text-dark-two_d"
				>
					<label for="ventas-per-page" class="whitespace-nowrap">Mostrar</label>
					<Select
						id="ventas-per-page"
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
