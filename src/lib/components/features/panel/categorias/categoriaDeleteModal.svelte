<script lang="ts">
	import { ModalConfirm } from '#lib/components/ui/index.ts';
	import { ErrorCode } from '#lib/interfaces/index.ts';
	import type { CategoriaItem } from '#lib/interfaces/index.ts';
	import { categoriaService, errorService } from '#lib/services/index.ts';
	import { alert } from '#lib/utils/index.ts';

	interface Props {
		/** Categoría a eliminar; null = modal cerrado */
		categoria: CategoriaItem | null;
		onClose: () => void;
		onDeleted: (categoria: CategoriaItem) => void;
	}

	let { categoria, onClose, onDeleted }: Props = $props();

	let isLoading = $state(false);

	function handleCancel() {
		// No cerrar a mitad de la petición para no perder la respuesta
		if (isLoading) return;
		onClose();
	}

	async function handleConfirm() {
		if (!categoria || isLoading) return;
		const target = categoria;

		isLoading = true;
		let deleted = false;
		try {
			await categoriaService.remove(target.id);
			alert('success', `Categoría «${target.nombre}» eliminada correctamente.`);
			onDeleted(target);
			deleted = true;
		} catch (error) {
			// 409: la categoría aún tiene subcategorías activas
			alert(
				'error',
				errorService.getMessage(error, {
					[ErrorCode.CONFLICT]:
						'No se puede eliminar una categoría que tiene subcategorías activas. Elimínalas o muévelas primero.'
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
	isOpen={!!categoria}
	message={categoria
		? `¿Seguro que deseas eliminar la categoría «${categoria.nombre}»? Dejará de aparecer en el listado. Sus productos no se eliminan: solo quedan sin esta categoría. Solo se puede eliminar si no tiene subcategorías activas.`
		: ''}
	loading={isLoading}
	onConfirm={handleConfirm}
	onCancel={handleCancel}
/>
