<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { MainLayout } from '#lib/components/layout/index.ts';
	import { ProductoFichaSkeleton } from '#lib/components/skeletons/index.ts';
	import { Button, EmptyState } from '#lib/components/ui/index.ts';
	import { ProductoForm } from '#lib/components/features/panel/productos/index.ts';
	import { Action, Module } from '#lib/config/index.ts';
	import {
		AlertTriangleIcon,
		ArrowLeftIcon,
		PackageIcon,
		RefreshIcon
	} from '#lib/icons/outline/index.ts';
	import type { Color, ProductoDetalle, SeccionArbol, Talla } from '#lib/interfaces/index.ts';
	import {
		categoriaService,
		colorService,
		errorService,
		tallaService
	} from '#lib/services/index.ts';
	import { currentRole } from '#lib/stores/index.ts';
	import { can, flattenCategoriaArbol } from '#lib/utils/index.ts';

	const canCreate = $derived(can($currentRole, Module.PRODUCTO, Action.CREATE));

	// Catálogos que el formulario necesita para elegir sección, categorías, colores y tallas
	let arbol = $state<SeccionArbol[]>([]);
	let colores = $state<Color[]>([]);
	let tallas = $state<Talla[]>([]);
	let isLoading = $state(true);
	let loadError = $state('');

	const secciones = $derived(arbol.map((grupo) => grupo.seccion));
	const categorias = $derived(flattenCategoriaArbol(arbol));

	async function loadCatalogos() {
		loadError = '';
		isLoading = true;
		try {
			[arbol, colores, tallas] = await Promise.all([
				categoriaService.arbol(),
				colorService.list(),
				tallaService.list()
			]);
		} catch (error) {
			loadError = errorService.getMessage(error);
		} finally {
			isLoading = false;
		}
	}

	function handleCreated(producto: ProductoDetalle) {
		goto(resolve('/panel/productos/[id]', { id: producto.id }));
	}

	onMount(loadCatalogos);
</script>

<MainLayout title="Nuevo producto" noIndex class="container mx-auto max-w-5xl space-y-4">
	<div>
		<Button variant="ghost" size="sm" href={resolve('/panel/productos')}>
			{#snippet leftIcon()}<ArrowLeftIcon class="size-4" />{/snippet}
			Volver a productos
		</Button>
	</div>

	{#if !canCreate}
		<EmptyState
			icon={PackageIcon}
			title="No tienes permiso para crear productos"
			description="Pide a un administrador que te dé acceso."
		/>
	{:else if isLoading}
		<ProductoFichaSkeleton />
	{:else if loadError}
		<EmptyState
			icon={AlertTriangleIcon}
			title="No se pudo preparar el formulario"
			description={loadError}
		>
			<Button variant="outline" size="sm" onclick={loadCatalogos}>
				{#snippet leftIcon()}<RefreshIcon class="size-4" />{/snippet}
				Reintentar
			</Button>
		</EmptyState>
	{:else}
		<ProductoForm {secciones} {categorias} {colores} {tallas} onCreated={handleCreated} />
	{/if}
</MainLayout>
