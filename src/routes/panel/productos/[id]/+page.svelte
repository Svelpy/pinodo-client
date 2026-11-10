<script lang="ts">
	import { onMount } from 'svelte';
	import { beforeNavigate, goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { MainLayout } from '#lib/components/layout/index.ts';
	import { ProductoFichaSkeleton } from '#lib/components/skeletons/index.ts';
	import { Button, EmptyState, ModalConfirm } from '#lib/components/ui/index.ts';
	import {
		ProductoColorDeleteModal,
		ProductoDeleteModal,
		ProductoFicha,
		ProductoStockModal
	} from '#lib/components/features/panel/productos/index.ts';
	import { Action, Module } from '#lib/config/index.ts';
	import {
		AlertTriangleIcon,
		ArrowLeftIcon,
		RefreshIcon,
		TrashIcon
	} from '#lib/icons/outline/index.ts';
	import { ErrorCode } from '#lib/interfaces/index.ts';
	import type {
		CategoriaItem,
		Color,
		ProductoColor,
		ProductoDetalle,
		ProductoFichaEdicion,
		ProductoSku,
		Seccion,
		Talla
	} from '#lib/interfaces/index.ts';
	import {
		AppError,
		categoriaService,
		colorService,
		errorService,
		productoService,
		tallaService
	} from '#lib/services/index.ts';
	import { currentRole } from '#lib/stores/index.ts';
	import { can, flattenCategoriaArbol } from '#lib/utils/index.ts';

	// Editar datos, colores y stock es actualizar el producto; quitar un color o el producto, eliminar
	const canUpdate = $derived(can($currentRole, Module.PRODUCTO, Action.UPDATE));
	const canDelete = $derived(can($currentRole, Module.PRODUCTO, Action.DELETE));

	let producto = $state<ProductoDetalle | null>(null);
	let isLoading = $state(true);
	let loadError = $state('');
	let notFound = $state(false);
	let isDeleting = $state(false);

	// ── Edición: un editor a la vez ───────────────────────────────────────────────────────────
	let editing = $state<ProductoFichaEdicion | null>(null);
	// El editor abierto tiene cambios sin guardar
	let dirty = $state(false);
	let deletingColor = $state<ProductoColor | null>(null);
	let stockTarget = $state<{ sku: ProductoSku; color: ProductoColor } | null>(null);

	// Catálogos de los editores: se piden al abrir el primero y se reutilizan
	let catalogos = $state<{
		secciones: Seccion[];
		categorias: CategoriaItem[];
		colores: Color[];
		tallas: Talla[];
	} | null>(null);
	let catalogosError = $state('');
	let catalogosPromise: Promise<void> | null = null;

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

	function loadCatalogos(): Promise<void> {
		catalogosError = '';
		catalogosPromise ??= (async () => {
			try {
				const [arbol, colores, tallas] = await Promise.all([
					categoriaService.arbol(),
					colorService.list(),
					tallaService.list()
				]);
				catalogos = {
					secciones: arbol.map((grupo) => grupo.seccion),
					categorias: flattenCategoriaArbol(arbol),
					colores,
					tallas
				};
			} catch (error) {
				catalogosError = errorService.getMessage(error);
				// Permite reintentar
				catalogosPromise = null;
			}
		})();
		return catalogosPromise;
	}

	function openEditor(edicion: ProductoFichaEdicion) {
		editing = edicion;
		dirty = false;
		if (!catalogos) loadCatalogos();
	}

	function closeEditor() {
		editing = null;
		dirty = false;
	}

	/**
	 * El resumen (rango de precios, stock total, portada, colores) lo calcula la API: tras cambiar
	 * colores o stock se pide la ficha en segundo plano solo para actualizarlo, sin esqueleto.
	 */
	async function refreshResumen() {
		if (!producto) return;
		try {
			const fresh = await productoService.get(producto.id);
			if (producto?.id === fresh.id) producto.resumen = fresh.resumen;
		} catch {
			// El resumen queda como estaba; los datos editados ya se ven actualizados
		}
	}

	// PATCH /productos responde la ficha completa, con el resumen ya calculado
	function handleDatosSaved(saved: ProductoDetalle) {
		producto = saved;
		closeEditor();
	}

	function handleColorSaved(saved: ProductoColor) {
		if (!producto) return;
		const exists = producto.colores.some((color) => color.id === saved.id);
		producto.colores = exists
			? producto.colores.map((color) => (color.id === saved.id ? saved : color))
			: [...producto.colores, saved];
		closeEditor();
		refreshResumen();
	}

	function handleColorDeleted({ id }: ProductoColor) {
		if (!producto) return;
		producto.colores = producto.colores.filter((color) => color.id !== id);
		refreshResumen();
	}

	function handleStockSaved(saved: ProductoSku) {
		if (!producto) return;
		for (const color of producto.colores) {
			const index = color.skus.findIndex((sku) => sku.id === saved.id);
			if (index !== -1) color.skus[index] = saved;
		}
		refreshResumen();
	}

	function handleDeleted() {
		goto(resolve('/panel/productos'));
	}

	// ── Aviso al salir con cambios sin guardar en el editor abierto ──────────────────────────
	let allowLeave = false;
	let leaveTo = $state<URL | null>(null);

	beforeNavigate(({ cancel, to, willUnload }) => {
		if (allowLeave || !editing || !dirty) return;
		cancel();
		if (!willUnload && to) leaveTo = to.url;
	});

	function confirmLeave() {
		const target = leaveTo;
		allowLeave = true;
		leaveTo = null;
		// `target` es la URL interna que SvelteKit ya resolvió al cancelar la navegación
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		if (target) goto(target);
	}

	onMount(loadProducto);
</script>

<MainLayout
	title={producto ? producto.nombre : 'Producto'}
	noIndex
	class="container mx-auto space-y-4"
>
	<div class="flex flex-wrap items-center justify-between gap-3">
		<Button variant="ghost" size="sm" href={resolve('/panel/productos')}>
			{#snippet leftIcon()}<ArrowLeftIcon class="size-4" />{/snippet}
			Volver a productos
		</Button>
		{#if producto && canDelete}
			<Button
				variant="outline"
				size="sm"
				onclick={() => (isDeleting = true)}
				disabled={editing !== null}
			>
				{#snippet leftIcon()}<TrashIcon class="size-4" />{/snippet}
				Eliminar producto
			</Button>
		{/if}
	</div>

	{#if isLoading}
		<ProductoFichaSkeleton />
	{:else if producto}
		<!-- Las acciones se pasan según permisos; sin handler no se muestran -->
		<ProductoFicha
			{producto}
			{editing}
			{catalogos}
			{catalogosError}
			onRetryCatalogos={loadCatalogos}
			onDirtyChange={(value) => (dirty = value)}
			onEdit={canUpdate ? openEditor : undefined}
			onDeleteColor={canDelete ? (color) => (deletingColor = color) : undefined}
			onAdjustStock={canUpdate ? (sku, color) => (stockTarget = { sku, color }) : undefined}
			onCancelEdit={closeEditor}
			onDatosSaved={handleDatosSaved}
			onColorSaved={handleColorSaved}
		/>
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

	<ProductoColorDeleteModal
		color={deletingColor}
		onClose={() => (deletingColor = null)}
		onDeleted={handleColorDeleted}
	/>

	<ProductoStockModal
		sku={stockTarget?.sku ?? null}
		colorNombre={stockTarget?.color.color.nombre}
		onClose={() => (stockTarget = null)}
		onSaved={handleStockSaved}
	/>

	<ModalConfirm
		isOpen={!!leaveTo}
		message="Tienes cambios sin guardar en el editor abierto. Si sales ahora se perderán. ¿Salir de todas formas?"
		onConfirm={confirmLeave}
		onCancel={() => (leaveTo = null)}
	/>
</MainLayout>
