<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import { beforeNavigate, goto } from '$app/navigation';
	import { MainLayout } from '#lib/components/layout/index.ts';
	import { PerfilSkeleton } from '#lib/components/skeletons/index.ts';
	import { Button, EmptyState, FormSection, ModalConfirm } from '#lib/components/ui/index.ts';
	import {
		PerfilDatosForm,
		PerfilPasswordSheet,
		PerfilResumen
	} from '#lib/components/features/panel/perfil/index.ts';
	import { AlertTriangleIcon, KeyIcon, RefreshIcon } from '#lib/icons/outline/index.ts';
	import type { CurrentUser } from '#lib/interfaces/index.ts';
	import { authService, errorService } from '#lib/services/index.ts';
	import { authStore, currentUserStore } from '#lib/stores/index.ts';
	import { buildSignInUrl } from '#lib/utils/index.ts';
	import { USUARIO_LIMITS } from '#lib/zod/index.ts';

	// El perfil es la sesión guardada; solo se pide a la API si falta (ver loadUsuario)
	const usuario = $derived($currentUserStore);

	let isLoading = $state(false);
	let loadError = $state('');
	let dirty = $state(false);
	let isPasswordOpen = $state(false);

	async function loadUsuario() {
		loadError = '';
		isLoading = true;
		try {
			// getMe() también guarda el usuario en localStorage
			authStore.setUser(await authService.getMe());
		} catch (error) {
			loadError = errorService.getMessage(error);
		} finally {
			isLoading = false;
		}
	}

	// PATCH responde el usuario completo: se actualiza la sesión (menú, header, permisos)
	function handleSaved(saved: CurrentUser) {
		dirty = false;
		authStore.setUser(saved);
	}

	// La API revocó todas las sesiones, también esta: se cierra en el navegador y se vuelve al login
	async function handlePasswordChanged() {
		isPasswordOpen = false;
		allowLeave = true;
		authStore.logout();
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- buildSignInUrl ya resuelve la ruta
		await goto(buildSignInUrl('password'), { replaceState: true });
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

	onMount(() => {
		if (!get(currentUserStore)) loadUsuario();
	});
</script>

<MainLayout title="Mi perfil" noIndex class="container mx-auto space-y-4">
	{#if usuario}
		<PerfilResumen {usuario} />

		<PerfilDatosForm {usuario} onDirtyChange={(value) => (dirty = value)} onSaved={handleSaved} />

		<FormSection
			title="Contraseña"
			description="Al cambiarla se cerrará tu sesión en todos los dispositivos."
		>
			{#snippet action()}
				<Button variant="outline" size="sm" onclick={() => (isPasswordOpen = true)}>
					{#snippet leftIcon()}<KeyIcon class="size-4" />{/snippet}
					Cambiar contraseña
				</Button>
			{/snippet}
			<p class="text-sm text-light-two_d dark:text-dark-two_d">
				Usa entre {USUARIO_LIMITS.PASSWORD_MIN} y {USUARIO_LIMITS.PASSWORD_MAX} caracteres y no la compartas
				con nadie.
			</p>
		</FormSection>
	{:else if loadError}
		<EmptyState
			icon={AlertTriangleIcon}
			title="No se pudo cargar tu perfil"
			description={loadError}
		>
			<Button variant="outline" size="sm" onclick={loadUsuario} disabled={isLoading}>
				{#snippet leftIcon()}<RefreshIcon class="size-4" />{/snippet}
				Reintentar
			</Button>
		</EmptyState>
	{:else}
		<PerfilSkeleton />
	{/if}

	<PerfilPasswordSheet
		isOpen={isPasswordOpen}
		onClose={() => (isPasswordOpen = false)}
		onChanged={handlePasswordChanged}
	/>

	<ModalConfirm
		isOpen={!!leaveTo}
		message="Tienes cambios sin guardar en tus datos. Si sales ahora se perderán. ¿Salir de todas formas?"
		onConfirm={confirmLeave}
		onCancel={() => (leaveTo = null)}
	/>
</MainLayout>
