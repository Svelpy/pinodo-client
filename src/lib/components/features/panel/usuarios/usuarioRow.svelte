<script lang="ts">
	import { Avatar, Badge, TableCell, TableRow } from '#lib/components/ui/index.ts';
	import type { Usuario } from '#lib/interfaces/index.ts';
	import { formatDate, formatFullName, formatValue } from '#lib/utils/index.ts';
	import UsuarioActions from './usuarioActions.svelte';

	interface Props {
		usuario: Usuario;
		/** El usuario es quien tiene la sesión iniciada */
		isCurrentUser?: boolean;
		onEdit?: (usuario: Usuario) => void;
		onResetPassword?: (usuario: Usuario) => void;
		onDelete?: (usuario: Usuario) => void;
	}

	let { usuario, isCurrentUser = false, onEdit, onResetPassword, onDelete }: Props = $props();

	const fullName = $derived(formatFullName(usuario));
</script>

<TableRow
	class="border-light-one_d hover:bg-light-one_d/50 dark:border-dark-one_d dark:hover:bg-dark-one_d/50"
>
	<TableCell class="px-4 py-3">
		<div class="flex min-w-0 items-center gap-3">
			<Avatar name={fullName} />
			<div class="min-w-0">
				<div class="flex min-w-0 items-center gap-2">
					<p class="truncate font-medium text-light-two dark:text-dark-two">{fullName}</p>
					{#if isCurrentUser}
						<Badge variant="info" size="sm">Tú</Badge>
					{/if}
				</div>
				<a
					href="mailto:{usuario.email}"
					class="block truncate text-xs text-light-two_d hover:underline dark:text-dark-two_d"
				>
					{usuario.email}
				</a>
			</div>
		</div>
	</TableCell>
	<TableCell class="px-4 py-3 text-sm">
		{#if usuario.telefono}
			<a
				href="tel:{usuario.telefono}"
				class="block truncate text-light-two hover:underline dark:text-dark-two"
			>
				{usuario.telefono}
			</a>
		{:else}
			<p class="text-light-two dark:text-dark-two">{formatValue(usuario.telefono)}</p>
		{/if}
	</TableCell>
	<TableCell
		class="hidden px-4 py-3 text-sm whitespace-nowrap text-light-two_d lg:table-cell dark:text-dark-two_d"
	>
		{formatDate(usuario.created_at)}
	</TableCell>
	<TableCell class="px-2 py-3 text-right">
		<UsuarioActions {usuario} {onEdit} {onResetPassword} {onDelete} />
	</TableCell>
</TableRow>
