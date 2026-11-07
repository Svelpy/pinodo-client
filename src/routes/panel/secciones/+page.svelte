<script lang="ts">
	import { onMount } from 'svelte';
	import { MainLayout } from '#lib/components/layout/index.ts';
	import { Button } from '#lib/components/ui/index.ts';
	import {
		SeccionDeleteModal,
		SeccionFilters,
		SeccionFormSheet,
		SeccionList
	} from '#lib/components/features/panel/secciones/index.ts';
	import { Action, Module } from '#lib/config/index.ts';
	import { PlusIcon } from '#lib/icons/outline/index.ts';
	import type { Seccion } from '#lib/interfaces/index.ts';
	import { errorService, seccionService } from '#lib/services/index.ts';
	import { currentRole } from '#lib/stores/index.ts';
	import { can } from '#lib/utils/index.ts';

	const canCreate = $derived(can($currentRole, Module.SECCION, Action.CREATE));
	const canUpdate = $derived(can($currentRole, Module.SECCION, Action.UPDATE));
	const canDelete = $derived(can($currentRole, Module.SECCION, Action.DELETE));

	let secciones = $state<Seccion[]>([]);
	// Filtro de visibilidad; null = sin filtro, se listan todas las secciones
	let isVisible = $state<boolean | null>(null);
	let isLoading = $state(false);
	let loadError = $state('');

	let isFormOpen = $state(false);
	// null = crear; con valor = editar esa sección
	let editingSeccion = $state<Seccion | null>(null);
	let deletingSeccion = $state<Seccion | null>(null);

	// Evita que una respuesta lenta de una carga anterior pise a la más reciente
	let lastRequestId = 0;

	async function loadSecciones() {
		const requestId = ++lastRequestId;
		loadError = '';
		isLoading = true;
		try {
			const response = await seccionService.list({ is_visible: isVisible ?? undefined });
			if (requestId !== lastRequestId) return;
			secciones = response;
		} catch (error) {
			if (requestId !== lastRequestId) return;
			loadError = errorService.getMessage(error);
		} finally {
			if (requestId === lastRequestId) isLoading = false;
		}
	}

	function applyVisibility(next: boolean | null) {
		isVisible = next;
		// Se limpia para que el listado muestre el esqueleto y no resultados del filtro anterior
		secciones = [];
		loadSecciones();
	}

	function openCreate() {
		editingSeccion = null;
		isFormOpen = true;
	}

	function openEdit(seccion: Seccion) {
		editingSeccion = seccion;
		isFormOpen = true;
	}

	// Se actualiza la lista localmente para no volver a pedir el listado
	function handleSaved(saved: Seccion) {
		if (editingSeccion) {
			// Si cambió a una visibilidad distinta del filtro ya no pertenece a esta vista
			if (isVisible !== null && saved.is_visible !== isVisible) {
				handleDeleted(saved);
				return;
			}
			secciones = secciones.map((seccion) => (seccion.id === saved.id ? saved : seccion));
			return;
		}

		if (isVisible === null || saved.is_visible === isVisible) {
			// Nueva: al inicio de la lista
			secciones = [saved, ...secciones];
			return;
		}

		// Creada con otra visibilidad: se abre su filtro para que se vea
		applyVisibility(saved.is_visible);
	}

	function handleDeleted({ id }: Seccion) {
		secciones = secciones.filter((seccion) => seccion.id !== id);
	}

	onMount(() => {
		loadSecciones();
	});
</script>

<MainLayout title="Secciones" noIndex class="container mx-auto space-y-4">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<SeccionFilters {isVisible} onChange={applyVisibility} />
		{#if canCreate}
			<Button onclick={openCreate} class="w-full sm:w-auto">
				{#snippet leftIcon()}<PlusIcon class="size-5" />{/snippet}
				Nueva sección
			</Button>
		{/if}
	</div>

	<!-- Las acciones se pasan según permisos; sin handler no se muestra la opción -->
	<SeccionList
		{secciones}
		{isVisible}
		{isLoading}
		error={loadError}
		onRetry={loadSecciones}
		onEdit={canUpdate ? openEdit : undefined}
		onDelete={canDelete ? (seccion) => (deletingSeccion = seccion) : undefined}
	/>

	<SeccionFormSheet
		isOpen={isFormOpen}
		seccion={editingSeccion}
		defaultVisible={isVisible}
		onClose={() => (isFormOpen = false)}
		onSaved={handleSaved}
	/>

	<SeccionDeleteModal
		seccion={deletingSeccion}
		onClose={() => (deletingSeccion = null)}
		onDeleted={handleDeleted}
	/>
</MainLayout>
