<script lang="ts">
	import { ModalConfirm } from '#lib/components/ui/index.ts';
	import { ErrorCode } from '#lib/interfaces/index.ts';
	import type { Color } from '#lib/interfaces/index.ts';
	import { colorService, errorService } from '#lib/services/index.ts';
	import { alert } from '#lib/utils/index.ts';

	interface Props {
		/** Color a eliminar; null = modal cerrado */
		color: Color | null;
		onClose: () => void;
		onDeleted: (color: Color) => void;
	}

	let { color, onClose, onDeleted }: Props = $props();

	let isLoading = $state(false);

	function handleCancel() {
		// No cerrar a mitad de la petición para no perder la respuesta
		if (isLoading) return;
		onClose();
	}

	async function handleConfirm() {
		if (!color || isLoading) return;
		const target = color;

		isLoading = true;
		let deleted = false;
		try {
			await colorService.remove(target.id);
			alert('success', `Color «${target.nombre}» eliminado correctamente.`);
			onDeleted(target);
			deleted = true;
		} catch (error) {
			// 409: el color está asignado a productos activos
			alert(
				'error',
				errorService.getMessage(error, {
					[ErrorCode.CONFLICT]: 'No se puede eliminar un color asignado a productos activos.'
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
	isOpen={!!color}
	message={color
		? `¿Seguro que deseas eliminar el color «${color.nombre}»? Dejará de aparecer en el listado. Solo se puede eliminar si no está asignado a productos activos.`
		: ''}
	loading={isLoading}
	onConfirm={handleConfirm}
	onCancel={handleCancel}
/>
