<script lang="ts">
	import { ModalConfirm } from '#lib/components/ui/index.ts';
	import type { Archivo } from '#lib/interfaces/index.ts';
	import { archivoService, errorService } from '#lib/services/index.ts';
	import { alert } from '#lib/utils/index.ts';

	interface Props {
		/** Imagen a eliminar; null = modal cerrado */
		archivo: Archivo | null;
		onClose: () => void;
		onDeleted: (archivo: Archivo) => void;
	}

	let { archivo, onClose, onDeleted }: Props = $props();

	let isLoading = $state(false);

	function handleCancel() {
		// No cerrar a mitad de la petición para no perder la respuesta
		if (isLoading) return;
		onClose();
	}

	async function handleConfirm() {
		if (!archivo || isLoading) return;
		const target = archivo;

		isLoading = true;
		let deleted = false;
		try {
			await archivoService.remove(target.id);
			alert('success', 'Imagen eliminada correctamente.');
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
	isOpen={!!archivo}
	message={archivo
		? `¿Seguro que deseas eliminar la imagen de «${archivo.producto_nombre}» (${archivo.color_nombre})? Dejará de mostrarse en el producto y en la tienda.`
		: ''}
	loading={isLoading}
	onConfirm={handleConfirm}
	onCancel={handleCancel}
/>
