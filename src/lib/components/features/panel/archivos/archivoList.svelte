<script lang="ts">
	import { ArchivoListSkeleton } from '#lib/components/skeletons/index.ts';
	import { AlertBox, Button, EmptyState, Pagination, Select } from '#lib/components/ui/index.ts';
	import { PAGINATION } from '#lib/constants/index.ts';
	import { AlertTriangleIcon, PhotoIcon, RefreshIcon } from '#lib/icons/outline/index.ts';
	import type { Archivo } from '#lib/interfaces/index.ts';
	import ArchivoCard from './archivoCard.svelte';

	interface Props {
		archivos: Archivo[];
		/** Hay una búsqueda o un filtro aplicado: cambia el mensaje de lista vacía */
		filtered: boolean;
		currentPage: number;
		totalPages: number;
		perPage: number;
		total: number;
		isLoading?: boolean;
		error?: string;
		onPageChange: (page: number) => void;
		onPerPageChange?: (perPage: number) => void;
		onRetry?: () => void;
		/** Acciones opcionales: las que no se pasan no se muestran (según permisos) */
		onView?: (archivo: Archivo) => void;
		onDelete?: (archivo: Archivo) => void;
	}

	let {
		archivos,
		filtered,
		currentPage,
		totalPages,
		perPage,
		total,
		isLoading = false,
		error = '',
		onPageChange,
		onPerPageChange,
		onRetry,
		onView,
		onDelete
	}: Props = $props();

	function handlePerPageChange(event: Event & { currentTarget: HTMLSelectElement }) {
		onPerPageChange?.(Number(event.currentTarget.value));
	}

	const hasData = $derived(archivos.length > 0);
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
			title="No se pudieron cargar los archivos"
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
		<ArchivoListSkeleton items={Math.min(perPage, 10)} />
	{:else if !hasData}
		<EmptyState
			icon={PhotoIcon}
			title={filtered ? 'Sin resultados' : 'No hay archivos'}
			description={filtered
				? 'Ninguna imagen coincide con la búsqueda. Prueba con otro nombre o quita el filtro.'
				: 'Las imágenes que agregues a tus productos aparecerán aquí.'}
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

		<ul
			class={[
				'grid grid-cols-2 gap-3 p-3 transition-opacity sm:grid-cols-3 md:p-4 lg:grid-cols-4 xl:grid-cols-5',
				isLoading && 'pointer-events-none opacity-60'
			]}
			aria-label="Imágenes"
		>
			{#each archivos as archivo (archivo.id)}
				<li class="min-w-0">
					<ArchivoCard {archivo} {onView} {onDelete} />
				</li>
			{/each}
		</ul>

		<div
			class="flex flex-col-reverse border-t border-light-one_d md:flex-row md:items-center dark:border-dark-one_d"
		>
			{#if onPerPageChange}
				<div
					class="flex items-center justify-center gap-2 px-4 pb-3 text-sm text-light-two_d md:pt-3 md:pr-0 md:pl-6 dark:text-dark-two_d"
				>
					<label for="archivos-per-page" class="whitespace-nowrap">Mostrar</label>
					<Select
						id="archivos-per-page"
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
