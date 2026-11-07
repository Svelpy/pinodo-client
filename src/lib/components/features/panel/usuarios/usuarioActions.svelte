<script lang="ts">
	import { DropdownMenu } from '#lib/components/ui/index.ts';
	import { DotsVerticalIcon, KeyIcon, PencilIcon, TrashIcon } from '#lib/icons/outline/index.ts';
	import type { DropdownOption, Usuario } from '#lib/interfaces/index.ts';
	import { currentRole } from '#lib/stores/index.ts';
	import { canManageUserRole, formatFullName } from '#lib/utils/index.ts';

	/**
	 * Solo se muestran las opciones cuyo handler se pasa (según permisos) y solo si el rol del
	 * usuario es inferior al propio: en una lista de todos los roles cada fila lo decide por sí misma.
	 */
	interface Props {
		usuario: Usuario;
		onEdit?: (usuario: Usuario) => void;
		onResetPassword?: (usuario: Usuario) => void;
		onDelete?: (usuario: Usuario) => void;
	}

	let { usuario, onEdit, onResetPassword, onDelete }: Props = $props();

	let isOpen = $state(false);
	let trigger = $state<HTMLButtonElement>();

	const canManage = $derived(canManageUserRole($currentRole, usuario.rol));

	const options = $derived<DropdownOption[]>(
		(canManage
			? [
					onEdit && {
						id: 'edit',
						label: 'Editar',
						icon: PencilIcon,
						action: () => onEdit(usuario)
					},
					onResetPassword && {
						id: 'reset-password',
						label: 'Restablecer contraseña',
						icon: KeyIcon,
						action: () => onResetPassword(usuario)
					},
					onDelete && {
						id: 'delete',
						label: 'Eliminar',
						icon: TrashIcon,
						divider: true,
						action: () => onDelete(usuario)
					}
				]
			: []
		).filter((option) => !!option)
	);
</script>

{#if options.length > 0}
	<button
		bind:this={trigger}
		type="button"
		onclick={() => (isOpen = !isOpen)}
		aria-label="Acciones de {formatFullName(usuario)}"
		aria-haspopup="menu"
		aria-expanded={isOpen}
		class="inline-flex size-9 items-center justify-center text-light-two_d transition-colors hover:bg-light-one_d hover:text-light-two focus-visible:ring-2 focus-visible:ring-light-three focus-visible:outline-none active:scale-95 dark:text-dark-two_d dark:hover:bg-dark-one_d dark:hover:text-dark-two dark:focus-visible:ring-dark-three"
	>
		<DotsVerticalIcon class="size-5" />
	</button>

	<DropdownMenu bind:isOpen {options} width={224} triggerElement={trigger} class="mt-1" />
{/if}
