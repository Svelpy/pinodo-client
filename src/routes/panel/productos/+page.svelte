<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { MainLayout } from '#lib/components/layout/index.ts';
	import { Button } from '#lib/components/ui/index.ts';
	import {
		ProductoDeleteModal,
		ProductoFilters,
		ProductoList
	} from '#lib/components/features/panel/productos/index.ts';
	import { Action, Module } from '#lib/config/index.ts';
	import { PAGINATION } from '#lib/constants/index.ts';
	import { PlusIcon } from '#lib/icons/outline/index.ts';
	import type { CategoriaItem, Producto, Seccion } from '#lib/interfaces/index.ts';
	import {
		categoriaService,
		errorService,
		productoService,
		seccionService
	} from '#lib/services/index.ts';
	import { currentRole } from '#lib/stores/index.ts';
	import { alert, can, flattenCategoriaArbol, getCategoriaOptions } from '#lib/utils/index.ts';

	const canCreate = $derived(can($currentRole, Module.PRODUCTO, Action.CREATE));
	const canUpdate = $derived(can($currentRole, Module.PRODUCTO, Action.UPDATE));
	const canDelete = $derived(can($currentRole, Module.PRODUCTO, Action.DELETE));

	let productos = $state<Producto[]>([]);
	let currentPage = $state<number>(PAGINATION.DEFAULT_PAGE);
	let perPage = $state<number>(PAGINATION.DEFAULT_PER_PAGE);
	let totalPages = $state(1);
	let total = $state(0);
	// Filtros; null / '' = sin filtro
	let seccionId = $state<string | null>(null);
	let categoriaId = $state<string | null>(null);
	let isVisible = $state<boolean | null>(null);
	let nombre = $state('');
	let isLoading = $state(false);
	let loadError = $state('');

	// Opciones de los filtros: todas las secciones, y las categorías de la sección elegida
	let secciones = $state<Seccion[]>([]);
	let catalogo = $state<CategoriaItem[]>([]);

	let deletingProducto = $state<Pick<Producto, 'id' | 'nombre'> | null>(null);

	const hasFilters = $derived(
		seccionId !== null || categoriaId !== null || isVisible !== null || nombre !== ''
	);
	const categoriaOptions = $derived(getCategoriaOptions(catalogo, seccionId ?? ''));

	// Evita que una respuesta lenta de una página anterior pise a la más reciente
	let lastRequestId = 0;

	async function loadProductos(page: number) {
		const requestId = ++lastRequestId;
		loadError = '';
		isLoading = true;
		try {
			const response = await productoService.list({
				page,
				per_page: perPage,
				seccion_id: seccionId ?? undefined,
				categoria_id: categoriaId ?? undefined,
				is_visible: isVisible ?? undefined,
				nombre: nombre || undefined
			});
			if (requestId !== lastRequestId) return;
			productos = response.data;
			currentPage = response.page;
			perPage = response.per_page;
			totalPages = Math.max(1, response.total_pages);
			total = response.total;
		} catch (error) {
			if (requestId !== lastRequestId) return;
			loadError = errorService.getMessage(error);
		} finally {
			if (requestId === lastRequestId) isLoading = false;
		}
	}

	// Opciones del filtro de sección. Si falla, el listado sigue funcionando sin ellas
	async function loadSecciones() {
		try {
			secciones = await seccionService.list();
		} catch {
			// El error del listado de productos se muestra aparte
		}
	}

	// Las categorías se piden solo al elegir una sección, y solo las de esa sección
	let lastCategoriasRequestId = 0;

	async function loadCategorias(forSeccionId: string | null) {
		const requestId = ++lastCategoriasRequestId;
		catalogo = [];
		if (!forSeccionId) return;
		try {
			const arbol = await categoriaService.arbol({ seccion_id: forSeccionId });
			if (requestId === lastCategoriasRequestId) catalogo = flattenCategoriaArbol(arbol);
		} catch {
			// Sin categorías el filtro queda vacío; el listado de productos no depende de ellas
		}
	}

	// Al cambiar la cantidad por página o un filtro se vuelve a la primera página
	function handlePerPageChange(value: number) {
		perPage = value;
		loadProductos(PAGINATION.DEFAULT_PAGE);
	}

	function reloadFromStart() {
		// Se limpia para que el listado muestre el esqueleto y no resultados del filtro anterior
		productos = [];
		loadProductos(PAGINATION.DEFAULT_PAGE);
	}

	function applySeccion(next: string | null) {
		seccionId = next;
		// La categoría pertenece a una sección: al cambiarla deja de aplicar
		categoriaId = null;
		loadCategorias(next);
		reloadFromStart();
	}

	function applyCategoria(next: string | null) {
		categoriaId = next;
		reloadFromStart();
	}

	function applyVisibility(next: boolean | null) {
		isVisible = next;
		reloadFromStart();
	}

	function applyNombre(next: string) {
		if (next === nombre) return;
		nombre = next;
		reloadFromStart();
	}

	// Productos con un cambio de visibilidad en curso: evita dobles envíos
	const toggling: Record<string, true> = {};

	/**
	 * Mismo endpoint que editar el producto, solo con `is_visible`. La fila se actualiza localmente
	 * (aunque haya un filtro de visibilidad activo, para no hacerla desaparecer de golpe).
	 */
	async function handleToggleVisible({ id, nombre, is_visible }: Producto) {
		if (toggling[id]) return;
		toggling[id] = true;
		try {
			const saved = await productoService.update(id, { is_visible: !is_visible });
			productos = productos.map((producto) =>
				producto.id === id ? { ...producto, is_visible: saved.is_visible } : producto
			);
			alert(
				'success',
				saved.is_visible ? `«${nombre}» ahora es visible.` : `«${nombre}» ahora está oculto.`
			);
		} catch (error) {
			alert('error', errorService.getMessage(error));
		} finally {
			delete toggling[id];
		}
	}

	// Se quita la fila localmente para no volver a pedir el listado
	function handleDeleted({ id }: Pick<Producto, 'id' | 'nombre'>) {
		productos = productos.filter((producto) => producto.id !== id);
		total = Math.max(0, total - 1);
		totalPages = Math.max(1, Math.ceil(total / perPage));

		// Página vacía con productos restantes: se recarga para traer los que se recorren
		if (productos.length === 0 && total > 0) {
			loadProductos(Math.min(currentPage, totalPages));
		}
	}

	onMount(() => {
		loadProductos(PAGINATION.DEFAULT_PAGE);
		loadSecciones();
	});
</script>

<MainLayout title="Productos" noIndex class="container mx-auto space-y-4">
	<div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
		<ProductoFilters
			{secciones}
			{categoriaOptions}
			{seccionId}
			{categoriaId}
			{isVisible}
			{nombre}
			onSeccionChange={applySeccion}
			onCategoriaChange={applyCategoria}
			onVisibleChange={applyVisibility}
			onNombreChange={applyNombre}
		/>
		{#if canCreate}
			<Button href={resolve('/panel/productos/nuevo')} class="w-full lg:w-auto">
				{#snippet leftIcon()}<PlusIcon class="size-5" />{/snippet}
				Nuevo producto
			</Button>
		{/if}
	</div>

	<!-- Ver la ficha siempre está disponible; Ocultar/Hacer visible y Eliminar según el permiso -->
	<ProductoList
		{productos}
		{hasFilters}
		{currentPage}
		{totalPages}
		{perPage}
		{total}
		{isLoading}
		error={loadError}
		onPageChange={loadProductos}
		onPerPageChange={handlePerPageChange}
		onRetry={() => loadProductos(currentPage)}
		onToggleVisible={canUpdate ? handleToggleVisible : undefined}
		onDelete={canDelete ? (producto) => (deletingProducto = producto) : undefined}
	/>

	<ProductoDeleteModal
		producto={deletingProducto}
		onClose={() => (deletingProducto = null)}
		onDeleted={handleDeleted}
	/>
</MainLayout>
