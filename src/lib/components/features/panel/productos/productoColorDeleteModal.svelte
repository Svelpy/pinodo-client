<script lang="ts">
	import { ModalConfirm } from '#lib/components/ui/index.ts';
	import type { ProductoColor } from '#lib/interfaces/index.ts';
	import { errorService, productoColorService } from '#lib/services/index.ts';
	import { alert } from '#lib/utils/index.ts';

	interface Props {
		/** Color del producto a eliminar; null = modal cerrado */
		color: ProductoColor | null;
		onClose: () => void;
		onDeleted: (color: ProductoColor) => void;
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
			await productoColorService.remove(target.id);
			alert('success', `Color «${target.color.nombre}» quitado del producto.`);
			onDeleted(target);
			deleted = true;
		} catch (error) {
			alert('error', errorService.getMessage(error), { duration: 4000 });
		} finally {
			isLoading = false;
		}

		if (deleted) onClose();
	}
</script>

<ModalConfirm
	isOpen={!!color}
	message={color
		? `¿Seguro que deseas quitar el color «${color.color.nombre}» de este producto? También se eliminarán sus ${color.imagenes.length} imágenes y sus ${color.skus.length} SKUs con su stock.`
		: ''}
	loading={isLoading}
	onConfirm={handleConfirm}
	onCancel={handleCancel}
/>
