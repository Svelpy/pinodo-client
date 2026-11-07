<script lang="ts">
	import { onMount } from 'svelte';
	import { MainLayout } from '#lib/components/layout/index.ts';
	import { Button } from '#lib/components/ui/index.ts';
	import {
		UsuarioDeleteModal,
		UsuarioFilters,
		UsuarioFormSheet,
		UsuarioList,
		UsuarioPasswordSheet
	} from '#lib/components/features/panel/usuarios/index.ts';
	import { Action, Module, type Role } from '#lib/config/index.ts';
	import { PAGINATION, ROLE_PLURAL_LABEL } from '#lib/constants/index.ts';
	import { PlusIcon } from '#lib/icons/outline/index.ts';
	import type { Usuario } from '#lib/interfaces/index.ts';
	import { errorService, usuarioService } from '#lib/services/index.ts';
	import { currentRole, currentUserStore } from '#lib/stores/index.ts';
	import {
		can,
		canManageUserRole,
		getAssignableUserRoles,
		getListableUserRoles
	} from '#lib/utils/index.ts';

	const canCreate = $derived(can($currentRole, Module.USUARIO, Action.CREATE));
	// Editar y restablecer contraseña son actualizaciones del usuario
	const canUpdate = $derived(can($currentRole, Module.USUARIO, Action.UPDATE));
	const canDelete = $derived(can($currentRole, Module.USUARIO, Action.DELETE));

	// El filtro ofrece el rol del usuario actual y los inferiores, en ese orden
	const listableRoles = $derived(getListableUserRoles($currentRole));
	const assignableRoles = $derived(getAssignableUserRoles($currentRole));
	const currentUserId = $derived($currentUserStore?.id ?? null);

	let usuarios = $state<Usuario[]>([]);
	let currentPage = $state<number>(PAGINATION.DEFAULT_PAGE);
	let perPage = $state<number>(PAGINATION.DEFAULT_PER_PAGE);
	let totalPages = $state(1);
	let total = $state(0);
	// Rol del filtro; null = sin filtro, se listan todos los usuarios
	let role = $state<Role | null>(null);
	let isLoading = $state(false);
	let loadError = $state('');

	let isFormOpen = $state(false);
	// null = crear; con valor = editar ese usuario
	let editingUsuario = $state<Usuario | null>(null);
	let passwordUsuario = $state<Usuario | null>(null);
	let deletingUsuario = $state<Usuario | null>(null);

	// Con un rol filtrado, todos los usuarios de la lista lo comparten: si es el propio nivel (o uno
	// superior) no se puede gestionar a nadie. Sin filtro cada fila decide por su propio rol.
	const isUnmanageableFilter = $derived(!!role && !canManageUserRole($currentRole, role));
	// Al crear se preselecciona el rol del filtro si se puede asignar
	const defaultRole = $derived(assignableRoles.find((value) => value === role) ?? null);
	const roleLabel = $derived(role ? ROLE_PLURAL_LABEL[role] : '');

	// Evita que una respuesta lenta de una página anterior pise a la más reciente
	let lastRequestId = 0;

	async function loadUsuarios(page: number) {
		const requestId = ++lastRequestId;
		loadError = '';
		isLoading = true;
		try {
			const response = await usuarioService.list({
				page,
				per_page: perPage,
				rol: role ?? undefined
			});
			if (requestId !== lastRequestId) return;
			usuarios = response.data;
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

	// Al cambiar la cantidad por página o el filtro se vuelve a la primera página
	function handlePerPageChange(value: number) {
		perPage = value;
		loadUsuarios(PAGINATION.DEFAULT_PAGE);
	}

	function applyRole(next: Role | null) {
		role = next;
		// Se limpia para que el listado muestre el esqueleto y no resultados del filtro anterior
		usuarios = [];
		loadUsuarios(PAGINATION.DEFAULT_PAGE);
	}

	function openCreate() {
		editingUsuario = null;
		isFormOpen = true;
	}

	function openEdit(usuario: Usuario) {
		editingUsuario = usuario;
		isFormOpen = true;
	}

	function removeFromList(id: string) {
		usuarios = usuarios.filter((usuario) => usuario.id !== id);
		total = Math.max(0, total - 1);
		totalPages = Math.max(1, Math.ceil(total / perPage));

		// Página vacía con usuarios restantes: se recarga para traer los que se recorren
		if (usuarios.length === 0 && total > 0) {
			loadUsuarios(Math.min(currentPage, totalPages));
		}
	}

	// Se actualiza la lista localmente para no volver a pedir el listado
	function handleSaved(saved: Usuario) {
		if (editingUsuario) {
			// Si cambió a un rol distinto del filtro ya no pertenece a esta vista
			if (role && saved.rol !== role) {
				removeFromList(saved.id);
				return;
			}
			usuarios = usuarios.map((usuario) => (usuario.id === saved.id ? saved : usuario));
			return;
		}

		if (!role || saved.rol === role) {
			// Nuevo: al inicio de la página actual
			usuarios = [saved, ...usuarios].slice(0, perPage);
			total += 1;
			totalPages = Math.max(1, Math.ceil(total / perPage));
			return;
		}

		// Creado con otro rol: se abre su filtro para que se vea
		const savedRole = listableRoles.find((value) => value === saved.rol);
		if (savedRole) applyRole(savedRole);
	}

	function handleDeleted({ id }: Usuario) {
		removeFromList(id);
	}

	onMount(() => {
		loadUsuarios(PAGINATION.DEFAULT_PAGE);
	});
</script>

{#snippet createButton()}
	<Button onclick={openCreate} class="w-full sm:w-auto">
		{#snippet leftIcon()}<PlusIcon class="size-5" />{/snippet}
		Nuevo usuario
	</Button>
{/snippet}

<MainLayout title="Usuarios" noIndex class="container mx-auto space-y-4">
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
		<UsuarioFilters roles={listableRoles} {role} onChange={applyRole} />
		{#if canCreate && assignableRoles.length > 0}
			{@render createButton()}
		{/if}
	</div>

	{#if isUnmanageableFilter && (canUpdate || canDelete)}
		<p class="text-sm text-light-two_d dark:text-dark-two_d">
			Solo puedes editar, restablecer la contraseña o eliminar usuarios con un rol inferior al tuyo.
			Para cambiar tus propios datos usa tu perfil.
		</p>
	{/if}

	<!-- Las acciones se pasan según permisos; cada fila las muestra solo si su rol es inferior al propio -->
	<UsuarioList
		{usuarios}
		{currentUserId}
		{roleLabel}
		{currentPage}
		{totalPages}
		{perPage}
		{total}
		{isLoading}
		error={loadError}
		onPageChange={loadUsuarios}
		onPerPageChange={handlePerPageChange}
		onRetry={() => loadUsuarios(currentPage)}
		onEdit={canUpdate ? openEdit : undefined}
		onResetPassword={canUpdate ? (usuario) => (passwordUsuario = usuario) : undefined}
		onDelete={canDelete ? (usuario) => (deletingUsuario = usuario) : undefined}
	/>

	<UsuarioFormSheet
		isOpen={isFormOpen}
		usuario={editingUsuario}
		{assignableRoles}
		{defaultRole}
		onClose={() => (isFormOpen = false)}
		onSaved={handleSaved}
	/>

	<UsuarioPasswordSheet usuario={passwordUsuario} onClose={() => (passwordUsuario = null)} />

	<UsuarioDeleteModal
		usuario={deletingUsuario}
		onClose={() => (deletingUsuario = null)}
		onDeleted={handleDeleted}
	/>
</MainLayout>
