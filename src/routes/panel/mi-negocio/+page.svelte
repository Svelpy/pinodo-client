<script lang="ts">
	import { onMount } from 'svelte';
	import { beforeNavigate, goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { MainLayout } from '#lib/components/layout/index.ts';
	import { NegocioFormSkeleton } from '#lib/components/skeletons/index.ts';
	import { Button, EmptyState, ModalConfirm } from '#lib/components/ui/index.ts';
	import { NegocioForm } from '#lib/components/features/panel/negocio/index.ts';
	import { Action, Module } from '#lib/config/index.ts';
	import { AlertTriangleIcon, ArrowUpRightIcon, RefreshIcon } from '#lib/icons/outline/index.ts';
	import type { Tienda } from '#lib/interfaces/index.ts';
	import { errorService, tiendaService } from '#lib/services/index.ts';
	import { currentRole, tiendaStore } from '#lib/stores/index.ts';
	import { can, formatDateTime } from '#lib/utils/index.ts';

	const canUpdate = $derived(can($currentRole, Module.NEGOCIO, Action.UPDATE));

	let tienda = $state<Tienda | null>(null);
	let isLoading = $state(true);
	let loadError = $state('');
	let dirty = $state(false);

	// Evita que una respuesta lenta (p. ej. de un reintento anterior) pise a la más reciente
	let lastRequestId = 0;

	// Se pide siempre a la API (no a la copia guardada) para editar sobre los datos actuales
	async function loadTienda() {
		const requestId = ++lastRequestId;
		loadError = '';
		isLoading = true;
		try {
			const response = await tiendaService.get();
			if (requestId !== lastRequestId) return;
			tienda = response;
			tiendaStore.set(response);
		} catch (error) {
			if (requestId !== lastRequestId) return;
			loadError = errorService.getMessage(error);
		} finally {
			if (requestId === lastRequestId) isLoading = false;
		}
	}

	// PATCH responde la configuración completa: también se actualiza el nombre y logo del panel
	function handleSaved(saved: Tienda) {
		tienda = saved;
		dirty = false;
		tiendaStore.set(saved);
	}

	// ── Aviso al salir con cambios sin guardar ────────────────────────────────────────────────
	let allowLeave = false;
	let leaveTo = $state<URL | null>(null);

	beforeNavigate(({ cancel, to, willUnload }) => {
		if (allowLeave || !dirty) return;
		// Al cerrar o recargar la pestaña el navegador muestra su propio aviso
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

	onMount(loadTienda);
</script>

<MainLayout title="Mi negocio" noIndex class="container mx-auto space-y-4">
	<div class="flex flex-wrap items-center justify-between gap-3">
		<p class="text-sm text-light-two_d dark:text-dark-two_d">
			{#if tienda?.updated_at}
				Última actualización: {formatDateTime(tienda.updated_at)}
			{:else}
				Datos públicos de tu tienda.
			{/if}
		</p>
		<!-- Otra pestaña: no se pierde lo que se está editando -->
		<Button
			variant="outline"
			size="sm"
			href={resolve('/(tienda)')}
			target="_blank"
			rel="noopener noreferrer"
			class="w-full sm:w-auto"
		>
			Ver tienda
			{#snippet rightIcon()}<ArrowUpRightIcon class="size-4" />{/snippet}
		</Button>
	</div>

	{#if isLoading && !tienda}
		<NegocioFormSkeleton />
	{:else if tienda}
		<NegocioForm
			{tienda}
			readonly={!canUpdate}
			onDirtyChange={(value) => (dirty = value)}
			onSaved={handleSaved}
		/>
	{:else}
		<EmptyState
			icon={AlertTriangleIcon}
			title="No se pudieron cargar los datos del negocio"
			description={loadError}
		>
			<Button variant="outline" size="sm" onclick={loadTienda}>
				{#snippet leftIcon()}<RefreshIcon class="size-4" />{/snippet}
				Reintentar
			</Button>
		</EmptyState>
	{/if}

	<ModalConfirm
		isOpen={!!leaveTo}
		message="Tienes cambios sin guardar en los datos del negocio. Si sales ahora se perderán. ¿Salir de todas formas?"
		onConfirm={confirmLeave}
		onCancel={() => (leaveTo = null)}
	/>
</MainLayout>
