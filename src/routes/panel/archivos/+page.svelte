<script lang="ts">
	import { onMount } from 'svelte';
	import { MainLayout } from '#lib/components/layout/index.ts';
	import {
		ArchivoDeleteModal,
		ArchivoFilters,
		ArchivoList,
		ArchivoPreviewSheet
	} from '#lib/components/features/panel/archivos/index.ts';
	import { Action, Module } from '#lib/config/index.ts';
	import { PAGINATION, type ImagenTipo } from '#lib/constants/index.ts';
	import type { Archivo } from '#lib/interfaces/index.ts';
	import { archivoService, errorService } from '#lib/services/index.ts';
	import { currentRole } from '#lib/stores/index.ts';
	import { can } from '#lib/utils/index.ts';

	// Las imágenes se agregan desde cada producto: aquí solo se consultan y se eliminan
	const canDelete = $derived(can($currentRole, Module.ARCHIVO, Action.DELETE));

	let archivos = $state<Archivo[]>([]);
	let currentPage = $state<number>(PAGINATION.DEFAULT_PAGE);
	let perPage = $state<number>(PAGINATION.DEFAULT_PER_PAGE);
	let totalPages = $state(1);
	let total = $state(0);
	// Búsqueda por nombre de producto (vacío = sin filtro) y tipo (null = todos)
	let nombre = $state('');
	let tipo = $state<ImagenTipo | null>(null);
	let isLoading = $state(false);
	let loadError = $state('');

	let previewArchivo = $state<Archivo | null>(null);
	let deletingArchivo = $state<Archivo | null>(null);

	const filtered = $derived(nombre !== '' || tipo !== null);

	// Evita que una respuesta lenta de una página anterior pise a la más reciente
	let lastRequestId = 0;

	async function loadArchivos(page: number) {
		const requestId = ++lastRequestId;
		loadError = '';
		isLoading = true;
		try {
			const response = await archivoService.list({
				page,
				per_page: perPage,
				nombre: nombre || undefined,
				tipo: tipo ?? undefined
			});
			if (requestId !== lastRequestId) return;
			archivos = response.data;
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

	// Al cambiar la cantidad por página o un filtro se vuelve a la primera página
	function handlePerPageChange(value: number) {
		perPage = value;
		loadArchivos(PAGINATION.DEFAULT_PAGE);
	}

	function applyFilters() {
		// Se limpia para que el listado muestre el esqueleto y no resultados del filtro anterior
		archivos = [];
		loadArchivos(PAGINATION.DEFAULT_PAGE);
	}

	function handleNombreChange(value: string) {
		if (value === nombre) return;
		nombre = value;
		applyFilters();
	}

	function handleTipoChange(value: ImagenTipo | null) {
		tipo = value;
		applyFilters();
	}

	// El detalle cierra antes de confirmar: ambos son diálogos modales y no pueden apilarse
	function requestDelete(archivo: Archivo) {
		previewArchivo = null;
		deletingArchivo = archivo;
	}

	// Se actualiza la lista localmente para no volver a pedir el listado
	function handleDeleted({ id }: Archivo) {
		archivos = archivos.filter((archivo) => archivo.id !== id);
		total = Math.max(0, total - 1);
		totalPages = Math.max(1, Math.ceil(total / perPage));

		// Página vacía con imágenes restantes: se recarga para traer las que se recorren
		if (archivos.length === 0 && total > 0) {
			loadArchivos(Math.min(currentPage, totalPages));
		}
	}

	onMount(() => {
		loadArchivos(PAGINATION.DEFAULT_PAGE);
	});
</script>

<MainLayout title="Archivos" noIndex class="container mx-auto space-y-4">
	<ArchivoFilters
		{nombre}
		{tipo}
		onNombreChange={handleNombreChange}
		onTipoChange={handleTipoChange}
	/>

	<!-- Las acciones se pasan según permisos; sin handler no se muestra la opción -->
	<ArchivoList
		{archivos}
		{filtered}
		{currentPage}
		{totalPages}
		{perPage}
		{total}
		{isLoading}
		error={loadError}
		onPageChange={loadArchivos}
		onPerPageChange={handlePerPageChange}
		onRetry={() => loadArchivos(currentPage)}
		onView={(archivo) => (previewArchivo = archivo)}
		onDelete={canDelete ? (archivo) => (deletingArchivo = archivo) : undefined}
	/>

	<ArchivoPreviewSheet
		archivo={previewArchivo}
		onClose={() => (previewArchivo = null)}
		onDelete={canDelete ? requestDelete : undefined}
	/>

	<ArchivoDeleteModal
		archivo={deletingArchivo}
		onClose={() => (deletingArchivo = null)}
		onDeleted={handleDeleted}
	/>
</MainLayout>
