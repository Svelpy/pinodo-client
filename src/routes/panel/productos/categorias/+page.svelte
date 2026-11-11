<script lang="ts">
	import { onMount } from 'svelte';
	import { MainLayout } from '#lib/components/layout/index.ts';
	import { Button } from '#lib/components/ui/index.ts';
	import {
		CategoriaDeleteModal,
		CategoriaFilters,
		CategoriaFormSheet,
		CategoriaList
	} from '#lib/components/features/panel/categorias/index.ts';
	import { Action, Module } from '#lib/config/index.ts';
	import { PlusIcon } from '#lib/icons/outline/index.ts';
	import type { Categoria, CategoriaItem, SeccionArbol } from '#lib/interfaces/index.ts';
	import { categoriaService, errorService } from '#lib/services/index.ts';
	import { currentRole } from '#lib/stores/index.ts';
	import { can, flattenCategoriaArbol } from '#lib/utils/index.ts';

	const canCreate = $derived(can($currentRole, Module.CATEGORIA, Action.CREATE));
	const canUpdate = $derived(can($currentRole, Module.CATEGORIA, Action.UPDATE));
	const canDelete = $derived(can($currentRole, Module.CATEGORIA, Action.DELETE));

	// Árbol completo, sin filtros: alimenta el select de secciones y el de categoría padre del formulario
	let fullArbol = $state<SeccionArbol[]>([]);
	// Lo que se muestra: el árbol filtrado, o el completo si no hay filtros
	let arbol = $state<SeccionArbol[]>([]);
	// Filtros; null = sin filtro
	let seccionId = $state<string | null>(null);
	let isVisible = $state<boolean | null>(null);
	let isLoading = $state(false);
	let loadError = $state('');

	let isFormOpen = $state(false);
	// null = crear; con valor = editar esa categoría
	let editingCategoria = $state<CategoriaItem | null>(null);
	// Valores preseleccionados al crear desde una sección o desde una categoría
	let defaultSeccionId = $state<string | null>(null);
	let defaultParentId = $state<string | null>(null);
	let deletingCategoria = $state<CategoriaItem | null>(null);

	const secciones = $derived(fullArbol.map((grupo) => grupo.seccion));
	const catalogo = $derived(flattenCategoriaArbol(fullArbol));
	const hasFilters = $derived(seccionId !== null || isVisible !== null);

	// Evita que una respuesta lenta de una carga anterior pise a la más reciente
	let lastRequestId = 0;

	function currentFilters() {
		return { seccion_id: seccionId ?? undefined, is_visible: isVisible ?? undefined };
	}

	// Pide el árbol completo y, si hay filtros, también el filtrado
	async function loadAll() {
		const requestId = ++lastRequestId;
		loadError = '';
		isLoading = true;
		try {
			const [full, filtered] = await Promise.all([
				categoriaService.arbol(),
				hasFilters ? categoriaService.arbol(currentFilters()) : null
			]);
			if (requestId !== lastRequestId) return;
			fullArbol = full;
			arbol = filtered ?? full;
		} catch (error) {
			if (requestId !== lastRequestId) return;
			loadError = errorService.getMessage(error);
		} finally {
			if (requestId === lastRequestId) isLoading = false;
		}
	}

	// Cambió un filtro: solo se vuelve a pedir la vista filtrada (el árbol completo ya está cargado)
	async function loadView() {
		if (!hasFilters) {
			if (fullArbol.length === 0) return loadAll();
			lastRequestId++;
			loadError = '';
			isLoading = false;
			arbol = fullArbol;
			return;
		}

		const requestId = ++lastRequestId;
		loadError = '';
		isLoading = true;
		try {
			const filtered = await categoriaService.arbol(currentFilters());
			if (requestId !== lastRequestId) return;
			arbol = filtered;
		} catch (error) {
			if (requestId !== lastRequestId) return;
			loadError = errorService.getMessage(error);
		} finally {
			if (requestId === lastRequestId) isLoading = false;
		}
	}

	function applyFilters(next: { seccionId?: string | null; isVisible?: boolean | null }) {
		if (next.seccionId !== undefined) seccionId = next.seccionId;
		if (next.isVisible !== undefined) isVisible = next.isVisible;
		// Se limpia para que el listado muestre el esqueleto y no resultados del filtro anterior
		arbol = [];
		loadView();
	}

	function openForm(
		categoria: CategoriaItem | null,
		defaults: { seccionId?: string; parentId?: string } = {}
	) {
		editingCategoria = categoria;
		defaultSeccionId = defaults.seccionId ?? seccionId;
		defaultParentId = defaults.parentId ?? null;
		isFormOpen = true;
		// Si la carga falló, se reintenta al abrir el formulario
		if (loadError) loadAll();
	}

	// Una categoría puede cambiar de padre, de sección o de visibilidad (que se hereda a sus
	// subcategorías), así que tras guardar o eliminar se vuelve a pedir el árbol en vez de parcharlo
	function handleSaved(saved: Categoria) {
		// Una categoría nueva fuera de los filtros activos no se vería: se quitan para mostrarla
		const isNew = !editingCategoria;
		const matches =
			(seccionId === null || saved.seccion_id === seccionId) &&
			(isVisible === null || saved.is_visible === isVisible);
		if (isNew && !matches) {
			seccionId = null;
			isVisible = null;
		}
		loadAll();
	}

	function handleDeleted() {
		loadAll();
	}

	onMount(() => {
		loadAll();
	});
</script>

<MainLayout title="Categorías" noIndex class="container mx-auto space-y-4">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
		<CategoriaFilters
			{secciones}
			{seccionId}
			{isVisible}
			onSeccionChange={(next) => applyFilters({ seccionId: next })}
			onVisibleChange={(next) => applyFilters({ isVisible: next })}
		/>
		{#if canCreate}
			<Button onclick={() => openForm(null)} class="w-full lg:w-auto">
				{#snippet leftIcon()}<PlusIcon class="size-5" />{/snippet}
				Nueva categoría
			</Button>
		{/if}
	</div>

	<CategoriaList
		{arbol}
		{hasFilters}
		{isLoading}
		error={loadError}
		onRetry={loadAll}
		onCreate={canCreate ? (id) => openForm(null, { seccionId: id }) : undefined}
		onCreateChild={canCreate
			? (categoria) => openForm(null, { seccionId: categoria.seccion_id, parentId: categoria.id })
			: undefined}
		onEdit={canUpdate ? (categoria) => openForm(categoria) : undefined}
		onDelete={canDelete ? (categoria) => (deletingCategoria = categoria) : undefined}
	/>

	<CategoriaFormSheet
		isOpen={isFormOpen}
		categoria={editingCategoria}
		{secciones}
		categorias={catalogo}
		catalogError={loadError}
		{defaultSeccionId}
		{defaultParentId}
		onClose={() => (isFormOpen = false)}
		onSaved={handleSaved}
	/>

	<CategoriaDeleteModal
		categoria={deletingCategoria}
		onClose={() => (deletingCategoria = null)}
		onDeleted={handleDeleted}
	/>
</MainLayout>
