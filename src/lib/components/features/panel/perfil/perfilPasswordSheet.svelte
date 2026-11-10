<script lang="ts">
	import { untrack } from 'svelte';
	import { AlertBox, Button, PasswordInput, Sheet } from '#lib/components/ui/index.ts';
	import { ErrorCode } from '#lib/interfaces/index.ts';
	import { AppError, errorService, perfilService } from '#lib/services/index.ts';
	import { validateSchema } from '#lib/utils/index.ts';
	import { changePerfilPasswordSchema, USUARIO_LIMITS } from '#lib/zod/index.ts';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
		/** La contraseña cambió: la API cerró todas las sesiones, también esta */
		onChanged: () => void;
	}

	let { isOpen, onClose, onChanged }: Props = $props();

	const id = $props.id();
	const FORM_ID = `${id}-form`;

	let currentPassword = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');
	let isLoading = $state(false);
	let fieldErrors = $state<Record<string, string>>({});
	let formError = $state('');

	// Formulario limpio cada vez que se abre
	$effect(() => {
		if (!isOpen) return;
		untrack(() => {
			currentPassword = '';
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
		formError = '';

		const result = validateSchema(changePerfilPasswordSchema, {
			current_password: currentPassword,
			new_password: newPassword,
			confirm_password: confirmPassword
		});
		if (!result.success) {
			fieldErrors = result.errors;
			return;
		}
		fieldErrors = {};

		isLoading = true;
		let changed = false;
		try {
			// La confirmación solo se valida en el cliente
			await perfilService.changePassword({
				current_password: result.data.current_password,
				new_password: result.data.new_password
			});
			changed = true;
		} catch (error) {
			fieldErrors = errorService.getFieldErrors(error);
			if (error instanceof AppError && error.is(ErrorCode.AUTHENTICATION_FAILED)) {
				fieldErrors = { current_password: 'La contraseña actual no es correcta.' };
			}
			formError = Object.keys(fieldErrors).length > 0 ? '' : errorService.getMessage(error);
		} finally {
			isLoading = false;
		}

		if (changed) onChanged();
	}
</script>

<Sheet
	open={isOpen}
	onClose={handleClose}
	dismissible={!isLoading}
	title="Cambiar contraseña"
	description="Al cambiarla se cerrará tu sesión en todos los dispositivos, también en este. Tendrás que iniciar sesión con la nueva."
>
	<form id={FORM_ID} onsubmit={handleSubmit} novalidate class="space-y-4">
		{#if formError}
			<AlertBox>{formError}</AlertBox>
		{/if}

		<fieldset class="space-y-4" disabled={isLoading}>
			<PasswordInput
				id="{id}-current-password"
				label="Contraseña actual"
				bind:value={currentPassword}
				error={fieldErrors.current_password}
				aria-invalid={!!fieldErrors.current_password}
				maxlength={USUARIO_LIMITS.PASSWORD_MAX}
				autocomplete="current-password"
				required
			/>
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
				label="Confirmar nueva contraseña"
				bind:value={confirmPassword}
				error={fieldErrors.confirm_password}
				aria-invalid={!!fieldErrors.confirm_password}
				maxlength={USUARIO_LIMITS.PASSWORD_MAX}
				autocomplete="new-password"
				placeholder="Repite la nueva contraseña"
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
				Cambiar contraseña
			</Button>
		</div>
	{/snippet}
</Sheet>
