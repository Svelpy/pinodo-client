<script lang="ts">
	import { ModalConfirm } from '#lib/components/ui/index.ts';
	import { ErrorCode } from '#lib/interfaces/index.ts';
	import type { Seccion } from '#lib/interfaces/index.ts';
	import { errorService, seccionService } from '#lib/services/index.ts';
	import { alert } from '#lib/utils/index.ts';

	interface Props {
		/** Sección a eliminar; null = modal cerrado */
		seccion: Seccion | null;
		onClose: () => void;
		onDeleted: (seccion: Seccion) => void;
	}

	let { seccion, onClose, onDeleted }: Props = $props();

	let isLoading = $state(false);

	function handleCancel() {
		// No cerrar a mitad de la petición para no perder la respuesta
		if (isLoading) return;
		onClose();
	}

	async function handleConfirm() {
		if (!seccion || isLoading) return;
		const target = seccion;

		isLoading = true;
		let deleted = false;
		try {
			await seccionService.remove(target.id);
			alert('success', `Sección «${target.nombre}» eliminada correctamente.`);
			onDeleted(target);
			deleted = true;
		} catch (error) {
			// 409: la sección aún tiene categorías o productos activos
			alert(
				'error',
				errorService.getMessage(error, {
					[ErrorCode.CONFLICT]:
						'No se puede eliminar una sección que tiene categorías o productos activos.'
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
	isOpen={!!seccion}
	message={seccion
		? `¿Seguro que deseas eliminar la sección «${seccion.nombre}»? Dejará de aparecer en el listado. Solo se puede eliminar si no tiene categorías ni productos activos.`
		: ''}
	loading={isLoading}
	onConfirm={handleConfirm}
	onCancel={handleCancel}
/>
