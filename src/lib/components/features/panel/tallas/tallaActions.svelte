<script lang="ts">
	import { DropdownMenu } from '#lib/components/ui/index.ts';
	import { DotsVerticalIcon, PencilIcon, TrashIcon } from '#lib/icons/outline/index.ts';
	import type { DropdownOption, Talla } from '#lib/interfaces/index.ts';

	/** Solo se muestran las opciones cuyo handler se pasa (según permisos) */
	interface Props {
		talla: Talla;
		onEdit?: (talla: Talla) => void;
		onDelete?: (talla: Talla) => void;
	}

	let { talla, onEdit, onDelete }: Props = $props();

	let isOpen = $state(false);
	let trigger = $state<HTMLButtonElement>();

	const options = $derived<DropdownOption[]>(
		[
			onEdit && {
				id: 'edit',
				label: 'Editar',
				icon: PencilIcon,
				action: () => onEdit(talla)
			},
			onDelete && {
				id: 'delete',
				label: 'Eliminar',
				icon: TrashIcon,
				divider: true,
				action: () => onDelete(talla)
			}
		].filter((option) => !!option)
	);
</script>

{#if options.length > 0}
	<button
		bind:this={trigger}
		type="button"
		onclick={() => (isOpen = !isOpen)}
		aria-label="Acciones de la talla {talla.etiqueta}"
		aria-haspopup="menu"
		aria-expanded={isOpen}
		class="inline-flex size-9 items-center justify-center text-light-two_d transition-colors hover:bg-light-one_d hover:text-light-two focus-visible:ring-2 focus-visible:ring-light-three focus-visible:outline-none active:scale-95 dark:text-dark-two_d dark:hover:bg-dark-one_d dark:hover:text-dark-two dark:focus-visible:ring-dark-three"
	>
		<DotsVerticalIcon class="size-5" />
	</button>

	<DropdownMenu bind:isOpen {options} width={224} triggerElement={trigger} class="mt-1" />
{/if}
