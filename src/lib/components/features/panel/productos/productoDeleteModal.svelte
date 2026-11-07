<script lang="ts">
	import { ModalConfirm } from '#lib/components/ui/index.ts';
	import type { Producto } from '#lib/interfaces/index.ts';
	import { errorService, productoService } from '#lib/services/index.ts';
	import { alert } from '#lib/utils/index.ts';

	type ProductoRef = Pick<Producto, 'id' | 'nombre'>;

	interface Props {
		/** Producto a eliminar; null = modal cerrado. Sirve tanto al listado como a la ficha */
		producto: ProductoRef | null;
		onClose: () => void;
		onDeleted: (producto: ProductoRef) => void;
	}

	let { producto, onClose, onDeleted }: Props = $props();

	let isLoading = $state(false);

	function handleCancel() {
		// No cerrar a mitad de la petición para no perder la respuesta
		if (isLoading) return;
		onClose();
	}

	async function handleConfirm() {
		if (!producto || isLoading) return;
		const target = producto;

		isLoading = true;
		let deleted = false;
		try {
			await productoService.remove(target.id);
			alert('success', `Producto «${target.nombre}» eliminado correctamente.`);
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
	isOpen={!!producto}
	message={producto
		? `¿Seguro que deseas eliminar el producto «${producto.nombre}»? También se eliminarán sus colores, imágenes y SKUs, y dejará de estar en sus categorías.`
		: ''}
	loading={isLoading}
	onConfirm={handleConfirm}
	onCancel={handleCancel}
/>
