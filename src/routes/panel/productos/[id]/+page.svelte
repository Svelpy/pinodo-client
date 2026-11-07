<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { MainLayout } from '#lib/components/layout/index.ts';
	import { ProductoFichaSkeleton } from '#lib/components/skeletons/index.ts';
	import { Button, EmptyState } from '#lib/components/ui/index.ts';
	import {
		ProductoDeleteModal,
		ProductoFicha
	} from '#lib/components/features/panel/productos/index.ts';
	import { Action, Module } from '#lib/config/index.ts';
	import {
		AlertTriangleIcon,
		ArrowLeftIcon,
		RefreshIcon,
		TrashIcon
	} from '#lib/icons/outline/index.ts';
	import { ErrorCode } from '#lib/interfaces/index.ts';
	import type { ProductoDetalle } from '#lib/interfaces/index.ts';
	import { AppError, errorService, productoService } from '#lib/services/index.ts';
	import { currentRole } from '#lib/stores/index.ts';
	import { can } from '#lib/utils/index.ts';

	const canDelete = $derived(can($currentRole, Module.PRODUCTO, Action.DELETE));

	let producto = $state<ProductoDetalle | null>(null);
	let isLoading = $state(true);
	let loadError = $state('');
	let notFound = $state(false);
	let isDeleting = $state(false);

	// Evita que una respuesta lenta de otro producto pise a la más reciente
	let lastRequestId = 0;

	async function loadProducto() {
		const requestId = ++lastRequestId;
		loadError = '';
		notFound = false;
		isLoading = true;
		try {
			const response = await productoService.get(page.params.id ?? '');
			if (requestId !== lastRequestId) return;
			producto = response;
		} catch (error) {
			if (requestId !== lastRequestId) return;
			producto = null;
			notFound = error instanceof AppError && error.is(ErrorCode.RESOURCE_NOT_FOUND);
			loadError = errorService.getMessage(error);
		} finally {
			if (requestId === lastRequestId) isLoading = false;
		}
	}

	function handleDeleted() {
		goto(resolve('/panel/productos'));
	}

	onMount(loadProducto);
</script>

<MainLayout
	title={producto ? producto.nombre : 'Producto'}
	noIndex
	class="container mx-auto max-w-5xl space-y-4"
>
	<div class="flex flex-wrap items-center justify-between gap-3">
		<Button variant="ghost" size="sm" href={resolve('/panel/productos')}>
			{#snippet leftIcon()}<ArrowLeftIcon class="size-4" />{/snippet}
			Volver a productos
		</Button>
		{#if producto && canDelete}
			<Button variant="outline" size="sm" onclick={() => (isDeleting = true)}>
				{#snippet leftIcon()}<TrashIcon class="size-4" />{/snippet}
				Eliminar
			</Button>
		{/if}
	</div>

	{#if isLoading}
		<ProductoFichaSkeleton />
	{:else if producto}
		<ProductoFicha {producto} />
	{:else}
		<EmptyState
			icon={AlertTriangleIcon}
			title={notFound ? 'El producto no existe' : 'No se pudo cargar el producto'}
			description={notFound ? 'Puede que se haya eliminado.' : loadError}
		>
			{#if !notFound}
				<Button variant="outline" size="sm" onclick={loadProducto}>
					{#snippet leftIcon()}<RefreshIcon class="size-4" />{/snippet}
					Reintentar
				</Button>
			{/if}
		</EmptyState>
	{/if}

	<ProductoDeleteModal
		producto={isDeleting ? producto : null}
		onClose={() => (isDeleting = false)}
		onDeleted={handleDeleted}
	/>
</MainLayout>
