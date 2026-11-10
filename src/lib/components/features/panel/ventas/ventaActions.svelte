<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { DropdownMenu } from '#lib/components/ui/index.ts';
	import { VENTA_ESTADO } from '#lib/constants/index.ts';
	import {
		CheckCircleIcon,
		DotsVerticalIcon,
		EyeIcon,
		PencilIcon,
		XIcon
	} from '#lib/icons/outline/index.ts';
	import type { DropdownOption, Venta } from '#lib/interfaces/index.ts';
	import { currentRole } from '#lib/stores/index.ts';
	import { accionesVenta, formatVentaNumero } from '#lib/utils/index.ts';

	/** Las opciones dependen del estado de la venta y del rol; las que no aplican no se muestran */
	interface Props {
		venta: Venta;
		onCobrar?: (venta: Venta) => void;
		onCancelar?: (venta: Venta) => void;
	}

	let { venta, onCobrar, onCancelar }: Props = $props();

	let isOpen = $state(false);
	let trigger = $state<HTMLButtonElement>();

	const acciones = $derived(accionesVenta(venta, $currentRole));

	const options = $derived<DropdownOption[]>(
		[
			{
				id: 'ver',
				label: 'Ver detalle',
				icon: EyeIcon,
				action: () => goto(resolve('/panel/historial-ventas/[id]', { id: venta.id }))
			},
			acciones.cobrar &&
				onCobrar && {
					id: 'cobrar',
					label: 'Cobrar',
					icon: CheckCircleIcon,
					action: () => onCobrar(venta)
				},
			acciones.editar && {
				id: 'editar',
				label: 'Editar pedido',
				icon: PencilIcon,
				action: () => goto(resolve('/panel/venta/[id]', { id: venta.id }))
			},
			acciones.cancelar &&
				onCancelar && {
					id: 'cancelar',
					label: venta.estado === VENTA_ESTADO.CONFIRMADA ? 'Anular venta' : 'Cancelar pedido',
					icon: XIcon,
					divider: true,
					action: () => onCancelar(venta)
				}
		].filter((option) => !!option)
	);
</script>

<button
	bind:this={trigger}
	type="button"
	onclick={(event) => {
		event.stopPropagation();
		isOpen = !isOpen;
	}}
	aria-label="Acciones de la venta {formatVentaNumero(venta.numero)}"
	aria-haspopup="menu"
	aria-expanded={isOpen}
	class="inline-flex size-9 items-center justify-center text-light-two_d transition-colors hover:bg-light-one_d hover:text-light-two focus-visible:ring-2 focus-visible:ring-light-three focus-visible:outline-none active:scale-95 dark:text-dark-two_d dark:hover:bg-dark-one_d dark:hover:text-dark-two dark:focus-visible:ring-dark-three"
>
	<DotsVerticalIcon class="size-5" />
</button>

<DropdownMenu bind:isOpen {options} width={224} triggerElement={trigger} class="mt-1" />
