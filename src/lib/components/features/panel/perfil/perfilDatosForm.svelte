<script lang="ts">
	import { untrack } from 'svelte';
	import { AlertBox, Button, FormSection, Input } from '#lib/components/ui/index.ts';
	import { ErrorCode } from '#lib/interfaces/index.ts';
	import type { CurrentUser, UpdatePerfilRequest } from '#lib/interfaces/index.ts';
	import { AppError, errorService, perfilService } from '#lib/services/index.ts';
	import { alert, validateSchema } from '#lib/utils/index.ts';
	import { perfilSchema, USUARIO_LIMITS } from '#lib/zod/index.ts';

	interface Props {
		usuario: CurrentUser;
		/** Avisa si hay cambios sin guardar (para avisar antes de salir de la página) */
		onDirtyChange?: (dirty: boolean) => void;
		/** Responde el usuario completo; el padre actualiza la sesión y el formulario se reinicia */
		onSaved: (usuario: CurrentUser) => void;
	}

	let { usuario, onDirtyChange, onSaved }: Props = $props();

	const id = $props.id();

	let nombre = $state('');
	let apellidos = $state('');
	let email = $state('');
	let telefono = $state('');
	let isLoading = $state(false);
	let fieldErrors = $state<Record<string, string>>({});
	let formError = $state('');

	// Solo los campos que difieren de la sesión (body del PATCH)
	const changes = $derived.by((): UpdatePerfilRequest => {
		const diff: UpdatePerfilRequest = {};
		const nextApellidos = apellidos.trim() || null;
		const nextTelefono = telefono.trim() || null;
		if (nombre.trim() !== usuario.nombre) diff.nombre = nombre.trim();
		if (nextApellidos !== (usuario.apellidos ?? null)) diff.apellidos = nextApellidos;
		if (email.trim().toLowerCase() !== usuario.email.toLowerCase()) diff.email = email.trim();
		if (nextTelefono !== (usuario.telefono ?? null)) diff.telefono = nextTelefono;
		return diff;
	});
	const hasChanges = $derived(Object.keys(changes).length > 0);

	$effect(() => {
		onDirtyChange?.(hasChanges);
	});

	function fillForm(source: CurrentUser) {
		nombre = source.nombre;
		apellidos = source.apellidos ?? '';
		email = source.email;
		telefono = source.telefono ?? '';
		fieldErrors = {};
		formError = '';
	}

	// Al guardar llega el usuario actualizado: el formulario parte de esos datos
	$effect(() => {
		const source = usuario;
		untrack(() => fillForm(source));
	});

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		formError = '';
		if (!hasChanges) return;

		const result = validateSchema(perfilSchema, { nombre, apellidos, email, telefono });
		if (!result.success) {
			fieldErrors = result.errors;
			return;
		}
		fieldErrors = {};

		isLoading = true;
		try {
			const saved = await perfilService.update(changes);
			alert('success', 'Tus datos se actualizaron correctamente.');
			onSaved(saved);
		} catch (error) {
			// Errores de validación del backend, para mostrarlos bajo cada campo
			fieldErrors = errorService.getFieldErrors(error);
			// El correo es el único dato único: un conflicto es que ya lo usa otro usuario
			if (error instanceof AppError && error.is(ErrorCode.CONFLICT)) {
				fieldErrors = { ...fieldErrors, email: 'Ya existe un usuario con este correo.' };
			}
			formError = Object.keys(fieldErrors).length > 0 ? '' : errorService.getMessage(error);
		} finally {
			isLoading = false;
		}
	}
</script>

<FormSection title="Datos personales" description="Tu nombre y cómo contactarte.">
	<form onsubmit={handleSubmit} novalidate class="space-y-4" aria-label="Datos personales">
		{#if formError}
			<AlertBox>{formError}</AlertBox>
		{/if}

		<fieldset class="grid gap-4 sm:grid-cols-2" disabled={isLoading}>
			<Input
				id="{id}-nombre"
				label="Nombre"
				bind:value={nombre}
				error={fieldErrors.nombre}
				aria-invalid={!!fieldErrors.nombre}
				maxlength={USUARIO_LIMITS.NOMBRE_MAX}
				autocomplete="given-name"
				required
			/>
			<Input
				id="{id}-apellidos"
				label="Apellidos (opcional)"
				bind:value={apellidos}
				error={fieldErrors.apellidos}
				aria-invalid={!!fieldErrors.apellidos}
				maxlength={USUARIO_LIMITS.APELLIDOS_MAX}
				autocomplete="family-name"
			/>
			<Input
				id="{id}-email"
				type="email"
				inputmode="email"
				label="Correo electrónico"
				bind:value={email}
				error={fieldErrors.email}
				aria-invalid={!!fieldErrors.email}
				maxlength={USUARIO_LIMITS.EMAIL_MAX}
				autocomplete="email"
				required
			/>
			<Input
				id="{id}-telefono"
				type="tel"
				inputmode="tel"
				label="Teléfono (opcional)"
				bind:value={telefono}
				error={fieldErrors.telefono}
				aria-invalid={!!fieldErrors.telefono}
				maxlength={USUARIO_LIMITS.TELEFONO_MAX}
				autocomplete="tel"
			/>
		</fieldset>

		{#if changes.email !== undefined}
			<AlertBox variant="info">Usarás el nuevo correo para iniciar sesión.</AlertBox>
		{/if}

		<div class="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
			{#if !hasChanges}
				<p
					class="text-center text-xs text-light-two_d sm:mr-auto sm:text-left dark:text-dark-two_d"
				>
					Modifica algún campo para guardar.
				</p>
			{/if}
			<Button
				variant="outline"
				onclick={() => fillForm(usuario)}
				disabled={isLoading || !hasChanges}
				class="w-full sm:w-auto"
			>
				Descartar
			</Button>
			<Button type="submit" loading={isLoading} disabled={!hasChanges} class="w-full sm:w-auto">
				Guardar cambios
			</Button>
		</div>
	</form>
</FormSection>
