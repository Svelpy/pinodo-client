<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { DropdownMenu } from '#lib/components/ui/index.ts';
	import { DotsVerticalIcon, EyeIcon, TrashIcon } from '#lib/icons/outline/index.ts';
	import type { DropdownOption, Producto } from '#lib/interfaces/index.ts';

	/** Ver la ficha siempre está disponible; eliminar solo si se pasa el handler (según permisos) */
	interface Props {
		producto: Producto;
		onDelete?: (producto: Producto) => void;
	}

	let { producto, onDelete }: Props = $props();

	let isOpen = $state(false);
	let trigger = $state<HTMLButtonElement>();

	const options = $derived<DropdownOption[]>(
		[
			{
				id: 'view',
				label: 'Ver ficha',
				icon: EyeIcon,
				action: () => goto(resolve('/panel/productos/[id]', { id: producto.id }))
			},
			onDelete && {
				id: 'delete',
				label: 'Eliminar',
				icon: TrashIcon,
				divider: true,
				action: () => onDelete(producto)
			}
		].filter((option) => !!option)
	);
</script>

<button
	bind:this={trigger}
	type="button"
	onclick={() => (isOpen = !isOpen)}
	aria-label="Acciones de {producto.nombre}"
	aria-haspopup="menu"
	aria-expanded={isOpen}
	class="inline-flex size-9 items-center justify-center text-light-two_d transition-colors hover:bg-light-one_d hover:text-light-two focus-visible:ring-2 focus-visible:ring-light-three focus-visible:outline-none active:scale-95 dark:text-dark-two_d dark:hover:bg-dark-one_d dark:hover:text-dark-two dark:focus-visible:ring-dark-three"
>
	<DotsVerticalIcon class="size-5" />
</button>

<DropdownMenu bind:isOpen {options} width={224} triggerElement={trigger} class="mt-1" />
