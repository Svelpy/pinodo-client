<script lang="ts">
	import { CategoriaListSkeleton } from '#lib/components/skeletons/index.ts';
	import { AlertBox, Button, EmptyState } from '#lib/components/ui/index.ts';
	import { AlertTriangleIcon, RefreshIcon, TagIcon } from '#lib/icons/outline/index.ts';
	import type { CategoriaItem, SeccionArbol } from '#lib/interfaces/index.ts';
	import CategoriaSeccion from './categoriaSeccion.svelte';

	interface Props {
		/** Secciones con su árbol de categorías */
		arbol: SeccionArbol[];
		/** Hay algún filtro activo: cambia el mensaje de lista vacía */
		hasFilters: boolean;
		isLoading?: boolean;
		error?: string;
		onRetry?: () => void;
		/** Acciones opcionales: las que no se pasan no se muestran (según permisos) */
		onCreate?: (seccionId: string) => void;
		onCreateChild?: (categoria: CategoriaItem) => void;
		onEdit?: (categoria: CategoriaItem) => void;
		onDelete?: (categoria: CategoriaItem) => void;
	}

	let {
		arbol,
		hasFilters,
		isLoading = false,
		error = '',
		onRetry,
		onCreate,
		onCreateChild,
		onEdit,
		onDelete
	}: Props = $props();

	const hasData = $derived(arbol.length > 0);
	// Primera carga: sin datos previos que mostrar mientras llega la respuesta
	const isInitialLoading = $derived(isLoading && !hasData);

	const frame =
		'overflow-hidden border border-light-one_d bg-light-one dark:border-dark-one_d dark:bg-dark-one';
</script>

<section>
	{#if error && !hasData}
		<div class={frame}>
			<EmptyState
				icon={AlertTriangleIcon}
				title="No se pudieron cargar las categorías"
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
	{:else if isInitialLoading}
		<div class={frame}>
			<CategoriaListSkeleton />
		</div>
	{:else if !hasData}
		<div class={frame}>
			<EmptyState
				icon={TagIcon}
				title={hasFilters ? 'No hay categorías con estos filtros' : 'No hay secciones registradas'}
				description={hasFilters
					? 'Prueba con otra combinación de filtros.'
					: 'Las categorías pertenecen a una sección: crea una primero.'}
			/>
		</div>
	{:else}
		{#if error}
			<AlertBox class="mb-4">
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

		<div class={['space-y-4 transition-opacity', isLoading && 'pointer-events-none opacity-60']}>
			{#each arbol as grupo (grupo.seccion.id)}
				<CategoriaSeccion {grupo} {onCreate} {onCreateChild} {onEdit} {onDelete} />
			{/each}
		</div>
	{/if}
</section>
