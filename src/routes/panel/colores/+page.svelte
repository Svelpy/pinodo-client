<script lang="ts">
	import { onMount } from 'svelte';
	import { MainLayout } from '#lib/components/layout/index.ts';
	import { Button } from '#lib/components/ui/index.ts';
	import {
		ColorDeleteModal,
		ColorFormSheet,
		ColorList
	} from '#lib/components/features/panel/colores/index.ts';
	import { Action, Module } from '#lib/config/index.ts';
	import { PlusIcon } from '#lib/icons/outline/index.ts';
	import type { Color } from '#lib/interfaces/index.ts';
	import { colorService, errorService } from '#lib/services/index.ts';
	import { currentRole } from '#lib/stores/index.ts';
	import { can } from '#lib/utils/index.ts';

	const canCreate = $derived(can($currentRole, Module.COLOR, Action.CREATE));
	const canUpdate = $derived(can($currentRole, Module.COLOR, Action.UPDATE));
	const canDelete = $derived(can($currentRole, Module.COLOR, Action.DELETE));

	let colores = $state<Color[]>([]);
	let isLoading = $state(false);
	let loadError = $state('');

	let isFormOpen = $state(false);
	// null = crear; con valor = editar ese color
	let editingColor = $state<Color | null>(null);
	let deletingColor = $state<Color | null>(null);

	// Evita que una respuesta lenta de una carga anterior pise a la más reciente
	let lastRequestId = 0;

	async function loadColores() {
		const requestId = ++lastRequestId;
		loadError = '';
		isLoading = true;
		try {
			const response = await colorService.list();
			if (requestId !== lastRequestId) return;
			colores = response;
		} catch (error) {
			if (requestId !== lastRequestId) return;
			loadError = errorService.getMessage(error);
		} finally {
			if (requestId === lastRequestId) isLoading = false;
		}
	}

	function openCreate() {
		editingColor = null;
		isFormOpen = true;
	}

	function openEdit(color: Color) {
		editingColor = color;
		isFormOpen = true;
	}

	function handleSaved(saved: Color, previous: Color | null) {
		// Solo cambiar el código no mueve al color: se reemplaza sin volver a pedir el listado
		if (previous && previous.nombre === saved.nombre) {
			colores = colores.map((color) => (color.id === saved.id ? saved : color));
			return;
		}

		// El listado va en orden alfabético por nombre: un color nuevo o renombrado puede caer en
		// otra posición, así que se vuelve a pedir
		loadColores();
	}

	function handleDeleted({ id }: Color) {
		colores = colores.filter((color) => color.id !== id);
	}

	onMount(() => {
		loadColores();
	});
</script>

<MainLayout title="Colores" noIndex class="container mx-auto space-y-4">
	{#if canCreate}
		<div class="flex sm:justify-end">
			<Button onclick={openCreate} class="w-full sm:w-auto">
				{#snippet leftIcon()}<PlusIcon class="size-5" />{/snippet}
				Nuevo color
			</Button>
		</div>
	{/if}

	<!-- Las acciones se pasan según permisos; sin handler no se muestra la opción -->
	<ColorList
		{colores}
		{isLoading}
		error={loadError}
		onRetry={loadColores}
		onEdit={canUpdate ? openEdit : undefined}
		onDelete={canDelete ? (color) => (deletingColor = color) : undefined}
	/>

	<ColorFormSheet
		isOpen={isFormOpen}
		color={editingColor}
		onClose={() => (isFormOpen = false)}
		onSaved={handleSaved}
	/>

	<ColorDeleteModal
		color={deletingColor}
		onClose={() => (deletingColor = null)}
		onDeleted={handleDeleted}
	/>
</MainLayout>
