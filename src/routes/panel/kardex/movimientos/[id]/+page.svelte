<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { MainLayout } from '#lib/components/layout/index.ts';
	import { KardexMovimientoDetalleSkeleton } from '#lib/components/skeletons/index.ts';
	import { Button, EmptyState } from '#lib/components/ui/index.ts';
	import { KardexMovimientoDetalle } from '#lib/components/features/panel/kardex/index.ts';
	import {
		AlertTriangleIcon,
		ArrowLeftIcon,
		ListIcon,
		RefreshIcon
	} from '#lib/icons/outline/index.ts';
	import { ErrorCode, type MovimientoInventario } from '#lib/interfaces/index.ts';
	import { AppError, errorService, kardexService } from '#lib/services/index.ts';

	const movimientoId = $derived(page.params.id ?? '');

	let movimiento = $state<MovimientoInventario | null>(null);
	let isLoading = $state(true);
	let loadError = $state('');
	let notFound = $state(false);

	// El kardex de la prenda: `?sku=` lo abre ya filtrado
	const kardexHref = $derived(
		movimiento
			? `${resolve('/panel/kardex')}?${new URLSearchParams({ sku: movimiento.sku.id })}`
			: resolve('/panel/kardex')
	);

	async function load() {
		isLoading = true;
		loadError = '';
		notFound = false;
		try {
			movimiento = await kardexService.get(movimientoId);
		} catch (error) {
			if (error instanceof AppError && error.is(ErrorCode.RESOURCE_NOT_FOUND)) notFound = true;
			else loadError = errorService.getMessage(error);
		} finally {
			isLoading = false;
		}
	}

	onMount(load);
</script>

<MainLayout title="Movimiento de inventario" noIndex class="container mx-auto space-y-4">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex items-center gap-2">
			<Button
				variant="ghost"
				size="sm"
				href={resolve('/panel/kardex')}
				aria-label="Volver al kardex"
			>
				{#snippet leftIcon()}<ArrowLeftIcon class="size-4" />{/snippet}
			</Button>
			<h2 class="text-xl font-bold text-light-two dark:text-dark-two">Movimiento</h2>
		</div>

		{#if movimiento}
			<!-- eslint-disable svelte/no-navigation-without-resolve -- resolve() en el href, más la query -->
			<Button variant="outline" href={kardexHref} class="w-full sm:w-auto">
				{#snippet leftIcon()}<ListIcon class="size-4" />{/snippet}
				Ver kardex de esta prenda
			</Button>
			<!-- eslint-enable svelte/no-navigation-without-resolve -->
		{/if}
	</div>

	{#if isLoading && !movimiento}
		<KardexMovimientoDetalleSkeleton />
	{:else if notFound}
		<EmptyState
			icon={AlertTriangleIcon}
			title="No encontramos este movimiento"
			description="Puede que el enlace sea incorrecto."
		>
			<Button variant="outline" size="sm" href={resolve('/panel/kardex')}>
				Ver todos los movimientos
			</Button>
		</EmptyState>
	{:else if loadError && !movimiento}
		<EmptyState
			icon={AlertTriangleIcon}
			title="No se pudo cargar el movimiento"
			description={loadError}
		>
			<Button variant="outline" size="sm" onclick={load}>
				{#snippet leftIcon()}<RefreshIcon class="size-4" />{/snippet}
				Reintentar
			</Button>
		</EmptyState>
	{:else if movimiento}
		<KardexMovimientoDetalle {movimiento} />
	{/if}
</MainLayout>
