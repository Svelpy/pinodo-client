<script lang="ts">
	import { FinanzasRentabilidadListSkeleton } from '#lib/components/skeletons/index.ts';
	import { Button, EmptyState, Pagination, Select } from '#lib/components/ui/index.ts';
	import { PAGINATION } from '#lib/constants/index.ts';
	import { AlertTriangleIcon, RefreshIcon, PackageIcon } from '#lib/icons/outline/index.ts';
	import type { RentabilidadSku } from '#lib/interfaces/index.ts';
	import { paginarLocal } from '#lib/utils/index.ts';
	import FinanzasRentabilidadCard from './finanzasRentabilidadCard.svelte';
	import FinanzasRentabilidadTable from './finanzasRentabilidadTable.svelte';

	/** Detalle del reporte de rentabilidad: una línea por SKU, de mayor a menor margen, paginado en el navegador */
	interface Props {
		/** null = todavía no se cargó */
		skus: RentabilidadSku[] | null;
		currentPage: number;
		perPage: number;
		isLoading?: boolean;
		error?: string;
		onPageChange: (page: number) => void;
		onPerPageChange: (perPage: number) => void;
		onRetry?: () => void;
	}

	let {
		skus,
		currentPage,
		perPage,
		isLoading = false,
		error = '',
		onPageChange,
		onPerPageChange,
		onRetry
	}: Props = $props();

	const pagina = $derived(paginarLocal(skus ?? [], currentPage, perPage));
	const perPageId = $props.id();
</script>

<section
	aria-label="Rentabilidad por SKU"
	aria-busy={isLoading}
	class="overflow-hidden border border-light-one_d bg-light-one dark:border-dark-one_d dark:bg-dark-one"
>
	<h3
		class="border-b border-light-one_d px-4 py-2.5 text-sm font-medium text-light-two_d dark:border-dark-one_d dark:text-dark-two_d"
	>
		Por SKU · de mayor a menor margen
	</h3>

	{#if error && !skus}
		<EmptyState icon={AlertTriangleIcon} title="No se pudo cargar el reporte" description={error}>
			{#if onRetry}
				<Button variant="outline" size="sm" onclick={onRetry}>
					{#snippet leftIcon()}<RefreshIcon class="size-4" />{/snippet}
					Reintentar
				</Button>
			{/if}
		</EmptyState>
	{:else if !skus}
		<FinanzasRentabilidadListSkeleton />
	{:else if skus.length === 0}
		<EmptyState
			icon={PackageIcon}
			title="No hay ventas en este periodo"
			description="Solo cuentan las ventas confirmadas, por su fecha de confirmación."
		/>
	{:else}
		<div class={['transition-opacity', isLoading && 'pointer-events-none opacity-60']}>
			<!-- Móvil y tablet pequeña: tarjetas -->
			<div class="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 md:hidden">
				{#each pagina.items as sku (sku.sku_id)}
					<FinanzasRentabilidadCard {sku} />
				{/each}
			</div>

			<!-- Tablet y escritorio: tabla -->
			<div class="hidden md:block">
				<FinanzasRentabilidadTable skus={pagina.items} />
			</div>
		</div>

		<div
			class="flex flex-col-reverse border-t border-light-one_d md:flex-row md:items-center dark:border-dark-one_d"
		>
			<div
				class="flex items-center justify-center gap-2 px-4 pb-3 text-sm text-light-two_d md:pt-3 md:pr-0 md:pl-6 dark:text-dark-two_d"
			>
				<label for={perPageId} class="whitespace-nowrap">Mostrar</label>
				<Select
					id={perPageId}
					value={perPage}
					onchange={(event) => onPerPageChange(Number(event.currentTarget.value))}
					class="w-20"
				>
					{#each PAGINATION.PER_PAGE_OPTIONS as option (option)}
						<option value={option}>{option}</option>
					{/each}
				</Select>
				<span class="whitespace-nowrap">por página</span>
			</div>

			<div class="min-w-0 flex-1">
				<Pagination
					currentPage={pagina.page}
					totalPages={pagina.totalPages}
					{perPage}
					total={skus.length}
					{onPageChange}
				/>
			</div>
		</div>
	{/if}
</section>
