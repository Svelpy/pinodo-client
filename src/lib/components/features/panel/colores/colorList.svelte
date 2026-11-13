<script lang="ts">
	import { ColorListSkeleton } from '#lib/components/skeletons/index.ts';
	import { AlertBox, Button, EmptyState } from '#lib/components/ui/index.ts';
	import { AlertTriangleIcon, BrushIcon, RefreshIcon } from '#lib/icons/outline/index.ts';
	import type { Color } from '#lib/interfaces/index.ts';
	import ColorCard from './colorCard.svelte';
	import ColorTable from './colorTable.svelte';

	interface Props {
		colores: Color[];
		isLoading?: boolean;
		error?: string;
		onRetry?: () => void;
		/** Acciones opcionales: las que no se pasan no se muestran (según permisos) */
		onEdit?: (color: Color) => void;
		onDelete?: (color: Color) => void;
	}

	let { colores, isLoading = false, error = '', onRetry, onEdit, onDelete }: Props = $props();

	const hasData = $derived(colores.length > 0);
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
			title="No se pudieron cargar los colores"
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
		<ColorListSkeleton />
	{:else if !hasData}
		<EmptyState
			icon={BrushIcon}
			title="No hay colores registrados"
			description="Cuando se creen colores aparecerán aquí."
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
				{#each colores as color (color.id)}
					<ColorCard {color} {onEdit} {onDelete} />
				{/each}
			</div>

			<!-- Tablet y escritorio: tabla -->
			<div class="hidden md:block">
				<ColorTable {colores} {onEdit} {onDelete} />
			</div>
		</div>
	{/if}
</section>
