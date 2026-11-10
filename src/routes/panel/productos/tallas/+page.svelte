<script lang="ts">
	import { onMount } from 'svelte';
	import { MainLayout } from '#lib/components/layout/index.ts';
	import { Button } from '#lib/components/ui/index.ts';
	import {
		TallaDeleteModal,
		TallaFormSheet,
		TallaList
	} from '#lib/components/features/panel/tallas/index.ts';
	import { Action, Module } from '#lib/config/index.ts';
	import { PlusIcon } from '#lib/icons/outline/index.ts';
	import type { Talla } from '#lib/interfaces/index.ts';
	import { errorService, tallaService } from '#lib/services/index.ts';
	import { currentRole } from '#lib/stores/index.ts';
	import { can } from '#lib/utils/index.ts';

	const canCreate = $derived(can($currentRole, Module.TALLA, Action.CREATE));
	const canUpdate = $derived(can($currentRole, Module.TALLA, Action.UPDATE));
	const canDelete = $derived(can($currentRole, Module.TALLA, Action.DELETE));

	let tallas = $state<Talla[]>([]);
	let isLoading = $state(false);
	let loadError = $state('');

	let isFormOpen = $state(false);
	// null = crear; con valor = editar esa talla
	let editingTalla = $state<Talla | null>(null);
	let deletingTalla = $state<Talla | null>(null);

	// Evita que una respuesta lenta de una carga anterior pise a la más reciente
	let lastRequestId = 0;

	async function loadTallas() {
		const requestId = ++lastRequestId;
		loadError = '';
		isLoading = true;
		try {
			const response = await tallaService.list();
			if (requestId !== lastRequestId) return;
			tallas = response;
		} catch (error) {
			if (requestId !== lastRequestId) return;
			loadError = errorService.getMessage(error);
		} finally {
			if (requestId === lastRequestId) isLoading = false;
		}
	}

	function openCreate() {
		editingTalla = null;
		isFormOpen = true;
	}

	function openEdit(talla: Talla) {
		editingTalla = talla;
		isFormOpen = true;
	}

	// Se actualiza la lista localmente para no volver a pedir el listado
	function handleSaved(saved: Talla) {
		// Editar la etiqueta no cambia el orden (va por fecha de creación): se reemplaza en su sitio
		if (editingTalla) {
			tallas = tallas.map((talla) => (talla.id === saved.id ? saved : talla));
			return;
		}

		// El listado va por fecha de creación, de la más antigua a la más reciente: la nueva va al final
		tallas = [...tallas, saved];
	}

	function handleDeleted({ id }: Talla) {
		tallas = tallas.filter((talla) => talla.id !== id);
	}

	onMount(() => {
		loadTallas();
	});
</script>

<MainLayout title="Tallas" noIndex class="container mx-auto space-y-4">
	{#if canCreate}
		<div class="flex sm:justify-end">
			<Button onclick={openCreate} class="w-full sm:w-auto">
				{#snippet leftIcon()}<PlusIcon class="size-5" />{/snippet}
				Nueva talla
			</Button>
		</div>
	{/if}

	<!-- Las acciones se pasan según permisos; sin handler no se muestra la opción -->
	<TallaList
		{tallas}
		{isLoading}
		error={loadError}
		onRetry={loadTallas}
		onEdit={canUpdate ? openEdit : undefined}
		onDelete={canDelete ? (talla) => (deletingTalla = talla) : undefined}
	/>

	<TallaFormSheet
		isOpen={isFormOpen}
		talla={editingTalla}
		onClose={() => (isFormOpen = false)}
		onSaved={handleSaved}
	/>

	<TallaDeleteModal
		talla={deletingTalla}
		onClose={() => (deletingTalla = null)}
		onDeleted={handleDeleted}
	/>
</MainLayout>
