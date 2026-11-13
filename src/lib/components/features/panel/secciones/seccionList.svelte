<script lang="ts">
	import { SeccionListSkeleton } from '#lib/components/skeletons/index.ts';
	import { AlertBox, Button, EmptyState } from '#lib/components/ui/index.ts';
	import { AlertTriangleIcon, LayoutGridIcon, RefreshIcon } from '#lib/icons/outline/index.ts';
	import type { Seccion } from '#lib/interfaces/index.ts';
	import SeccionCard from './seccionCard.svelte';
	import SeccionTable from './seccionTable.svelte';

	interface Props {
		secciones: Seccion[];
		/** Filtro de visibilidad activo; null = sin filtro. Para el mensaje de lista vacía */
		isVisible: boolean | null;
		isLoading?: boolean;
		error?: string;
		onRetry?: () => void;
		/** Acciones opcionales: las que no se pasan no se muestran (según permisos) */
		onEdit?: (seccion: Seccion) => void;
		onDelete?: (seccion: Seccion) => void;
	}

	let {
		secciones,
		isVisible,
		isLoading = false,
		error = '',
		onRetry,
		onEdit,
		onDelete
	}: Props = $props();

	const hasData = $derived(secciones.length > 0);
	// Primera carga: sin datos previos que mostrar mientras llega la respuesta
	const isInitialLoading = $derived(isLoading && !hasData);

	const emptyTitle = $derived(
		isVisible === null
			? 'No hay secciones registradas'
			: isVisible
				? 'No hay secciones visibles'
				: 'No hay secciones ocultas'
	);
	const emptyDescription = $derived(
		isVisible === null
			? 'Cuando se creen secciones aparecerán aquí.'
			: 'Ninguna sección cumple con este filtro.'
	);
</script>

<section
	aria-busy={isLoading}
	class="overflow-hidden border border-light-one_d bg-light-one dark:border-dark-one_d dark:bg-dark-one"
>
	{#if error && !hasData}
		<EmptyState
			icon={AlertTriangleIcon}
			title="No se pudieron cargar las secciones"
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
		<SeccionListSkeleton />
	{:else if !hasData}
		<EmptyState icon={LayoutGridIcon} title={emptyTitle} description={emptyDescription} />
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
				{#each secciones as seccion (seccion.id)}
					<SeccionCard {seccion} {onEdit} {onDelete} />
				{/each}
			</div>

			<!-- Tablet y escritorio: tabla -->
			<div class="hidden md:block">
				<SeccionTable {secciones} {onEdit} {onDelete} />
			</div>
		</div>
	{/if}
</section>
