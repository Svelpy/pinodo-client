<script lang="ts">
	import { ModalConfirm } from '#lib/components/ui/index.ts';
	import { ErrorCode } from '#lib/interfaces/index.ts';
	import type { Talla } from '#lib/interfaces/index.ts';
	import { errorService, tallaService } from '#lib/services/index.ts';
	import { alert } from '#lib/utils/index.ts';

	interface Props {
		/** Talla a eliminar; null = modal cerrado */
		talla: Talla | null;
		onClose: () => void;
		onDeleted: (talla: Talla) => void;
	}

	let { talla, onClose, onDeleted }: Props = $props();

	let isLoading = $state(false);

	function handleCancel() {
		// No cerrar a mitad de la petición para no perder la respuesta
		if (isLoading) return;
		onClose();
	}

	async function handleConfirm() {
		if (!talla || isLoading) return;
		const target = talla;

		isLoading = true;
		let deleted = false;
		try {
			await tallaService.remove(target.id);
			alert('success', `Talla «${target.etiqueta}» eliminada correctamente.`);
			onDeleted(target);
			deleted = true;
		} catch (error) {
			// 409: la talla está asignada a SKUs activos
			alert(
				'error',
				errorService.getMessage(error, {
					[ErrorCode.CONFLICT]: 'No se puede eliminar una talla asignada a SKUs activos.'
				}),
				{ duration: 4000 }
			);
		} finally {
			isLoading = false;
		}

		if (deleted) onClose();
	}
</script>

<ModalConfirm
	isOpen={!!talla}
	message={talla
		? `¿Seguro que deseas eliminar la talla «${talla.etiqueta}»? Dejará de aparecer en el listado. Solo se puede eliminar si no está asignada a SKUs activos.`
		: ''}
	loading={isLoading}
	onConfirm={handleConfirm}
	onCancel={handleCancel}
/>
