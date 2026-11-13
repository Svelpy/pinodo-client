<script lang="ts">
	import { UsuarioListSkeleton } from '#lib/components/skeletons/index.ts';
	import { AlertBox, Button, EmptyState, Pagination, Select } from '#lib/components/ui/index.ts';
	import { PAGINATION } from '#lib/constants/index.ts';
	import { AlertTriangleIcon, RefreshIcon, UsersIcon } from '#lib/icons/outline/index.ts';
	import type { Usuario } from '#lib/interfaces/index.ts';
	import UsuarioCard from './usuarioCard.svelte';
	import UsuarioTable from './usuarioTable.svelte';

	interface Props {
		usuarios: Usuario[];
		/** Usuario con la sesión iniciada, para marcarlo con "Tú" */
		currentUserId: string | null;
		/** Rol del filtro activo en plural (p. ej. "Cajeros"); vacío sin filtro. Para el mensaje de lista vacía */
		roleLabel: string;
		currentPage: number;
		totalPages: number;
		perPage: number;
		total: number;
		isLoading?: boolean;
		error?: string;
		onPageChange: (page: number) => void;
		onPerPageChange?: (perPage: number) => void;
		onRetry?: () => void;
		/** Acciones opcionales: las que no se pasan no se muestran (según permisos y jerarquía) */
		onEdit?: (usuario: Usuario) => void;
		onResetPassword?: (usuario: Usuario) => void;
		onDelete?: (usuario: Usuario) => void;
	}

	let {
		usuarios,
		currentUserId,
		roleLabel,
		currentPage,
		totalPages,
		perPage,
		total,
		isLoading = false,
		error = '',
		onPageChange,
		onPerPageChange,
		onRetry,
		onEdit,
		onResetPassword,
		onDelete
	}: Props = $props();

	function handlePerPageChange(event: Event & { currentTarget: HTMLSelectElement }) {
		onPerPageChange?.(Number(event.currentTarget.value));
	}

	const hasData = $derived(usuarios.length > 0);
	// Primera carga: sin datos previos que mostrar mientras llega la respuesta
	const isInitialLoading = $derived(isLoading && !hasData);
</script>

<section
	aria-busy={isLoading}
	class="overflow-hidden border border-light-one_d bg-light-one dark:border-dark-one_d dark:bg-dark-one"
>
	{#if error && !hasData}
		<EmptyState
			icon={AlertTriangleIcon}
			title="No se pudieron cargar los usuarios"
			description={error}
		>
			{#if onRetry}
				<Button variant="outline" size="sm" onclick={onRetry}>
					{#snippet leftIcon()}<RefreshIcon class="size-4" />{/snippet}
					Reintentar
				</Button>
			{/if}
		</EmptyState>
	{:else if isInitialLoading}
		<UsuarioListSkeleton />
	{:else if !hasData}
		<EmptyState
			icon={UsersIcon}
			title={roleLabel
				? `No hay ${roleLabel.toLowerCase()} registrados`
				: 'No hay usuarios registrados'}
			description={roleLabel
				? 'Cuando se creen usuarios con este rol aparecerán aquí.'
				: 'Cuando se creen usuarios aparecerán aquí.'}
		/>
	{:else}
		{#if error}
			<AlertBox class="border-0 border-b">
				{error}
				{#snippet action()}
					{#if onRetry}
						<button
							type="button"
							onclick={onRetry}
							class="font-medium underline underline-offset-2"
						>
							Reintentar
						</button>
					{/if}
				{/snippet}
			</AlertBox>
		{/if}

		<div class={['transition-opacity', isLoading && 'pointer-events-none opacity-60']}>
			<!-- Móvil y tablet pequeña: tarjetas -->
			<div class="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 md:hidden">
				{#each usuarios as usuario (usuario.id)}
					<UsuarioCard
						{usuario}
						isCurrentUser={usuario.id === currentUserId}
						{onEdit}
						{onResetPassword}
						{onDelete}
					/>
				{/each}
			</div>

			<!-- Tablet y escritorio: tabla -->
			<div class="hidden md:block">
				<UsuarioTable {usuarios} {currentUserId} {onEdit} {onResetPassword} {onDelete} />
			</div>
		</div>

		<div
			class="flex flex-col-reverse border-t border-light-one_d md:flex-row md:items-center dark:border-dark-one_d"
		>
			{#if onPerPageChange}
				<div
					class="flex items-center justify-center gap-2 px-4 pb-3 text-sm text-light-two_d md:pt-3 md:pr-0 md:pl-6 dark:text-dark-two_d"
				>
					<label for="usuarios-per-page" class="whitespace-nowrap">Mostrar</label>
					<Select
						id="usuarios-per-page"
						value={perPage}
						onchange={handlePerPageChange}
						disabled={isLoading}
						class="w-20"
					>
						{#each PAGINATION.PER_PAGE_OPTIONS as option (option)}
							<option value={option}>{option}</option>
						{/each}
					</Select>
					<span class="whitespace-nowrap">por página</span>
				</div>
			{/if}

			<div class="min-w-0 flex-1">
				<Pagination {currentPage} {totalPages} {perPage} {total} {onPageChange} />
			</div>
		</div>
	{/if}
</section>
