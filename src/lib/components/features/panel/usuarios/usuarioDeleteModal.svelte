<script lang="ts">
	import { ModalConfirm } from '#lib/components/ui/index.ts';
	import type { Usuario } from '#lib/interfaces/index.ts';
	import { errorService, usuarioService } from '#lib/services/index.ts';
	import { alert, formatFullName, formatRole } from '#lib/utils/index.ts';

	interface Props {
		/** Usuario a eliminar; null = modal cerrado */
		usuario: Usuario | null;
		onClose: () => void;
		onDeleted: (usuario: Usuario) => void;
	}

	let { usuario, onClose, onDeleted }: Props = $props();

	let isLoading = $state(false);

	const fullName = $derived(usuario ? formatFullName(usuario) : '');

	function handleCancel() {
		// No cerrar a mitad de la petición para no perder la respuesta
		if (isLoading) return;
		onClose();
	}

	async function handleConfirm() {
		if (!usuario || isLoading) return;
		const target = usuario;
		const targetName = fullName;

		isLoading = true;
		let deleted = false;
		try {
			await usuarioService.remove(target.id);
			alert('success', `Usuario «${targetName}» eliminado correctamente.`);
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
	isOpen={!!usuario}
	message={usuario
		? `¿Seguro que deseas eliminar a «${fullName}» (${formatRole(usuario.rol)})? Se cerrará su sesión en todos los dispositivos y dejará de aparecer en el listado.`
		: ''}
	loading={isLoading}
	onConfirm={handleConfirm}
	onCancel={handleCancel}
/>
