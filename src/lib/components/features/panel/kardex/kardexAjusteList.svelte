<script lang="ts">
	import { KardexAjusteListSkeleton } from '#lib/components/skeletons/index.ts';
	import { AlertBox, Button, EmptyState, Pagination, Select } from '#lib/components/ui/index.ts';
	import { PAGINATION } from '#lib/constants/index.ts';
	import { AlertTriangleIcon, FileDescriptionIcon, RefreshIcon } from '#lib/icons/outline/index.ts';
	import type { AjusteInventario } from '#lib/interfaces/index.ts';
	import KardexAjusteCard from './kardexAjusteCard.svelte';
	import KardexAjusteTable from './kardexAjusteTable.svelte';

	interface Props {
		ajustes: AjusteInventario[];
		/** Quién registró cada ajuste; null = no se muestra */
		registradoPor: ((ajuste: AjusteInventario) => string | undefined) | null;
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
		ajustes,
		registradoPor,
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

	const hasData = $derived(ajustes.length > 0);
	const isInitialLoading = $derived(isLoading && !hasData);
</script>

<section
	aria-busy={isLoading}
	class="overflow-hidden border border-light-one_d bg-light-one dark:border-dark-one_d dark:bg-dark-one"
>
	{#if error && !hasData}
		<EmptyState
			icon={AlertTriangleIcon}
			title="No se pudieron cargar los ajustes"
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
		<KardexAjusteListSkeleton />
	{:else if !hasData}
		<EmptyState
			icon={FileDescriptionIcon}
			title={filtrada ? 'No hay ajustes con estos filtros' : 'Todavía no hay ajustes'}
			description={filtrada
				? 'Prueba con otro rango de fechas o quita algún filtro.'
				: 'Las recepciones, conteos, mermas y correcciones de stock aparecerán aquí.'}
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
				{#each ajustes as ajuste (ajuste.id)}
					<KardexAjusteCard {ajuste} registradoPor={registradoPor?.(ajuste)} />
				{/each}
			</div>

			<!-- Tablet y escritorio: tabla -->
			<div class="hidden md:block">
				<KardexAjusteTable {ajustes} {registradoPor} />
			</div>
		</div>

		<div
			class="flex flex-col-reverse border-t border-light-one_d md:flex-row md:items-center dark:border-dark-one_d"
		>
			{#if onPerPageChange}
				<div
					class="flex items-center justify-center gap-2 px-4 pb-3 text-sm text-light-two_d md:pt-3 md:pr-0 md:pl-6 dark:text-dark-two_d"
				>
					<label for="ajustes-per-page" class="whitespace-nowrap">Mostrar</label>
					<Select
						id="ajustes-per-page"
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
