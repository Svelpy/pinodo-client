<script lang="ts">
	import { TallaListSkeleton } from '#lib/components/skeletons/index.ts';
	import { AlertBox, Button, EmptyState } from '#lib/components/ui/index.ts';
	import { AlertTriangleIcon, RefreshIcon, ScaleIcon } from '#lib/icons/outline/index.ts';
	import type { Talla } from '#lib/interfaces/index.ts';
	import TallaCard from './tallaCard.svelte';
	import TallaTable from './tallaTable.svelte';

	interface Props {
		tallas: Talla[];
		isLoading?: boolean;
		error?: string;
		onRetry?: () => void;
		/** Acciones opcionales: las que no se pasan no se muestran (según permisos) */
		onEdit?: (talla: Talla) => void;
		onDelete?: (talla: Talla) => void;
	}

	let { tallas, isLoading = false, error = '', onRetry, onEdit, onDelete }: Props = $props();

	const hasData = $derived(tallas.length > 0);
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
			title="No se pudieron cargar las tallas"
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
		<TallaListSkeleton />
	{:else if !hasData}
		<EmptyState
			icon={ScaleIcon}
			title="No hay tallas registradas"
			description="Cuando se creen tallas aparecerán aquí."
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
				{#each tallas as talla (talla.id)}
					<TallaCard {talla} {onEdit} {onDelete} />
				{/each}
			</div>

			<!-- Tablet y escritorio: tabla -->
			<div class="hidden md:block">
				<TallaTable {tallas} {onEdit} {onDelete} />
			</div>
		</div>
	{/if}
</section>
