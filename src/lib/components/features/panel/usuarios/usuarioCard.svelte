<script lang="ts">
	import { Avatar, Badge } from '#lib/components/ui/index.ts';
	import { MailIcon, PhoneIcon } from '#lib/icons/outline/index.ts';
	import type { Usuario } from '#lib/interfaces/index.ts';
	import { formatDate, formatFullName } from '#lib/utils/index.ts';
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

<article
	class="flex gap-3 border border-light-one_d bg-light-one p-4 dark:border-dark-one_d dark:bg-dark-one"
>
	<Avatar name={fullName} size="lg" />
	<div class="min-w-0 flex-1">
		<div class="flex min-w-0 items-center gap-2">
			<h3 class="truncate font-semibold text-light-two dark:text-dark-two">{fullName}</h3>
			{#if isCurrentUser}
				<Badge variant="info" size="sm">Tú</Badge>
			{/if}
		</div>

		<div class="mt-2 space-y-1 text-sm">
			<a
				href="mailto:{usuario.email}"
				class="flex min-w-0 items-center gap-1.5 text-light-two_d dark:text-dark-two_d"
			>
				<MailIcon class="size-4 shrink-0" />
				<span class="truncate">{usuario.email}</span>
			</a>
			{#if usuario.telefono}
				<a
					href="tel:{usuario.telefono}"
					class="flex items-center gap-1.5 font-medium text-light-three dark:text-dark-three"
				>
					<PhoneIcon class="size-4 shrink-0" />
					{usuario.telefono}
				</a>
			{/if}
		</div>
		<p class="mt-2 text-xs text-light-two_d dark:text-dark-two_d">
			Creado el {formatDate(usuario.created_at)}
		</p>
	</div>
	<div class="-mt-1.5 -mr-2 shrink-0 self-start">
		<UsuarioActions {usuario} {onEdit} {onResetPassword} {onDelete} />
	</div>
</article>
