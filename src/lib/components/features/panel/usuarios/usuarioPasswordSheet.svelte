<script lang="ts">
	import { untrack } from 'svelte';
	import { AlertBox, Button, PasswordInput, Sheet } from '#lib/components/ui/index.ts';
	import type { Usuario } from '#lib/interfaces/index.ts';
	import { errorService, usuarioService } from '#lib/services/index.ts';
	import { alert, formatFullName, validateSchema } from '#lib/utils/index.ts';
	import { resetUsuarioPasswordSchema, USUARIO_LIMITS } from '#lib/zod/index.ts';

	interface Props {
		/** Usuario al que se restablece la contraseña; null = cerrado */
		usuario: Usuario | null;
		onClose: () => void;
	}

	let { usuario, onClose }: Props = $props();

	const id = $props.id();
	const FORM_ID = `${id}-form`;

	let newPassword = $state('');
	let confirmPassword = $state('');
	let isLoading = $state(false);
	let fieldErrors = $state<Record<string, string>>({});
	let formError = $state('');

	const isOpen = $derived(!!usuario);
	const fullName = $derived(usuario ? formatFullName(usuario) : '');

	// Formulario limpio cada vez que se abre
	$effect(() => {
		if (!isOpen) return;
		untrack(() => {
			newPassword = '';
			confirmPassword = '';
			fieldErrors = {};
			formError = '';
		});
	});

	function handleClose() {
		// No cerrar a mitad de la petición para no perder la respuesta
		if (isLoading) return;
		onClose();
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!usuario) return;
		formError = '';

		const result = validateSchema(resetUsuarioPasswordSchema, {
			new_password: newPassword,
			confirm_password: confirmPassword
		});
		if (!result.success) {
			fieldErrors = result.errors;
			return;
		}
		fieldErrors = {};

		isLoading = true;
		let saved = false;
		try {
			// La confirmación solo se valida en el cliente: la API recibe únicamente la nueva contraseña
			await usuarioService.resetPassword(usuario.id, { new_password: result.data.new_password });
			alert('success', `Contraseña de «${fullName}» restablecida correctamente.`);
			saved = true;
		} catch (error) {
			fieldErrors = errorService.getFieldErrors(error);
			formError = Object.keys(fieldErrors).length > 0 ? '' : errorService.getMessage(error);
		} finally {
			isLoading = false;
		}

		if (saved) handleClose();
	}
</script>

<Sheet
	open={isOpen}
	onClose={handleClose}
	dismissible={!isLoading}
	title="Restablecer contraseña"
	description={usuario
		? `Define una nueva contraseña para ${fullName}. Se cerrará su sesión en todos los dispositivos.`
		: undefined}
>
	<form id={FORM_ID} onsubmit={handleSubmit} novalidate class="space-y-4">
		{#if formError}
			<AlertBox>{formError}</AlertBox>
		{/if}

		<fieldset class="space-y-4" disabled={isLoading}>
			<PasswordInput
				id="{id}-new-password"
				label="Nueva contraseña"
				bind:value={newPassword}
				error={fieldErrors.new_password}
				aria-invalid={!!fieldErrors.new_password}
				maxlength={USUARIO_LIMITS.PASSWORD_MAX}
				autocomplete="new-password"
				placeholder="Entre {USUARIO_LIMITS.PASSWORD_MIN} y {USUARIO_LIMITS.PASSWORD_MAX} caracteres"
				required
			/>
			<PasswordInput
				id="{id}-confirm-password"
				label="Confirmar contraseña"
				bind:value={confirmPassword}
				error={fieldErrors.confirm_password}
				aria-invalid={!!fieldErrors.confirm_password}
				maxlength={USUARIO_LIMITS.PASSWORD_MAX}
				autocomplete="new-password"
				placeholder="Repite la contraseña"
				required
			/>
		</fieldset>
	</form>

	{#snippet footer()}
		<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
			<Button variant="outline" onclick={handleClose} disabled={isLoading} class="w-full sm:w-auto">
				Cancelar
			</Button>
			<Button type="submit" form={FORM_ID} loading={isLoading} class="w-full sm:w-auto">
				Restablecer
			</Button>
		</div>
	{/snippet}
</Sheet>
