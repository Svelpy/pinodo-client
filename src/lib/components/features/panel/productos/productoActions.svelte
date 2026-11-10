<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { DropdownMenu } from '#lib/components/ui/index.ts';
	import { DotsVerticalIcon, EyeIcon, EyeOffIcon, TrashIcon } from '#lib/icons/outline/index.ts';
	import type { DropdownOption, Producto } from '#lib/interfaces/index.ts';

	/**
	 * Ver la ficha siempre está disponible; cambiar la visibilidad y eliminar solo si se pasa el
	 * handler (según permisos)
	 */
	interface Props {
		producto: Producto;
		onToggleVisible?: (producto: Producto) => void;
		onDelete?: (producto: Producto) => void;
	}

	let { producto, onToggleVisible, onDelete }: Props = $props();

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
			onToggleVisible && {
				id: 'toggle-visible',
				label: producto.is_visible ? 'Ocultar' : 'Hacer visible',
				icon: producto.is_visible ? EyeOffIcon : EyeIcon,
				action: () => onToggleVisible(producto)
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
