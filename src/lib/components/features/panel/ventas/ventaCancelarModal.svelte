<script lang="ts">
	import { ModalConfirm } from '#lib/components/ui/index.ts';
	import { VENTA_ESTADO } from '#lib/constants/index.ts';
	import type { Venta, VentaDetalle } from '#lib/interfaces/index.ts';
	import { errorService, ventaService } from '#lib/services/index.ts';
	import { alert, formatCurrency, formatVentaNumero } from '#lib/utils/index.ts';

	interface Props {
		/** Venta a cancelar o anular; null = cerrado */
		venta: Venta | VentaDetalle | null;
		onClose: () => void;
		onCancelled: (venta: VentaDetalle) => void;
	}

	let { venta, onClose, onCancelled }: Props = $props();

	let isLoading = $state(false);

	const cobrada = $derived(venta?.estado === VENTA_ESTADO.CONFIRMADA);
	const message = $derived.by(() => {
		if (!venta) return '';
		const nombre = `${formatVentaNumero(venta.numero)} (${formatCurrency(venta.total)})`;
		return cobrada
			? `¿Anular la venta ${nombre}? Las prendas vuelven al stock, los pagos se registran como devueltos y la venta deja de contar en la caja. No se puede deshacer.`
			: `¿Cancelar el pedido ${nombre}? No se podrá cobrar ni editar después.`;
	});

	function handleCancel() {
		if (isLoading) return;
		onClose();
	}

	async function handleConfirm() {
		if (!venta || isLoading) return;
		const target = venta;
		const eraCobrada = cobrada;
		isLoading = true;
		let done = false;
		try {
			const cancelada = await ventaService.cancelar(target.id);
			alert(
				'success',
				eraCobrada
					? `Venta ${formatVentaNumero(target.numero)} anulada; el stock se devolvió.`
					: `Pedido ${formatVentaNumero(target.numero)} cancelado.`
			);
			onCancelled(cancelada);
			done = true;
		} catch (error) {
			alert('error', errorService.getMessage(error), { duration: 4000 });
		} finally {
			isLoading = false;
		}
		if (done) onClose();
	}
</script>

<ModalConfirm
	isOpen={!!venta}
	{message}
	loading={isLoading}
	onConfirm={handleConfirm}
	onCancel={handleCancel}
/>
