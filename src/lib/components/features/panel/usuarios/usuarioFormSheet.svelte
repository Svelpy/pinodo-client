<script lang="ts">
	import { untrack } from 'svelte';
	import {
		AlertBox,
		Button,
		Input,
		PasswordInput,
		Select,
		Sheet
	} from '#lib/components/ui/index.ts';
	import type { AssignableUserRole } from '#lib/config/index.ts';
	import { ROLE_LABEL } from '#lib/constants/index.ts';
	import { ErrorCode } from '#lib/interfaces/index.ts';
	import type { UpdateUsuarioRequest, Usuario } from '#lib/interfaces/index.ts';
	import { AppError, errorService, usuarioService } from '#lib/services/index.ts';
	import { alert, formatFullName, validateSchema } from '#lib/utils/index.ts';
	import { createUsuarioSchema, updateUsuarioSchema, USUARIO_LIMITS } from '#lib/zod/index.ts';

	interface Props {
		isOpen: boolean;
		/** Si se pasa, el formulario edita ese usuario; si no, crea uno nuevo */
		usuario?: Usuario | null;
		/** Roles que el usuario actual puede asignar (solo inferiores al suyo) */
		assignableRoles: readonly AssignableUserRole[];
		/** Rol preseleccionado al crear (p. ej. el del filtro activo) */
		defaultRole?: AssignableUserRole | null;
		onClose: () => void;
		onSaved: (usuario: Usuario) => void;
	}

	let {
		isOpen,
		usuario = null,
		assignableRoles,
		defaultRole = null,
		onClose,
		onSaved
	}: Props = $props();

	const id = $props.id();
	const FORM_ID = `${id}-form`;

	let email = $state('');
	let nombre = $state('');
	let apellidos = $state('');
	let telefono = $state('');
	let rol = $state('');
	let password = $state('');
	let isLoading = $state(false);
	let fieldErrors = $state<Record<string, string>>({});
	let formError = $state('');

	const isEdit = $derived(!!usuario);

	// Solo los campos que difieren del usuario original (body del PATCH)
	const changes = $derived.by((): UpdateUsuarioRequest => {
		if (!usuario) return {};
		const diff: UpdateUsuarioRequest = {};
		const nextApellidos = apellidos.trim() || null;
		const nextTelefono = telefono.trim() || null;
		if (nombre.trim() !== usuario.nombre) diff.nombre = nombre.trim();
		if (nextApellidos !== (usuario.apellidos ?? null)) diff.apellidos = nextApellidos;
		if (email.trim() !== usuario.email) diff.email = email.trim();
		if (nextTelefono !== (usuario.telefono ?? null)) diff.telefono = nextTelefono;
		if (rol !== usuario.rol) diff.rol = rol as AssignableUserRole;
		return diff;
	});
	const hasChanges = $derived(Object.keys(changes).length > 0);

	function fillForm(source: Usuario | null) {
		email = source?.email ?? '';
		nombre = source?.nombre ?? '';
		apellidos = source?.apellidos ?? '';
		telefono = source?.telefono ?? '';
		rol = source?.rol ?? defaultRole ?? '';
		password = '';
		fieldErrors = {};
		formError = '';
	}

	// Cargar los datos cada vez que se abre (vacío al crear, el usuario al editar)
	$effect(() => {
		if (isOpen) untrack(() => fillForm(usuario));
	});

	function handleClose() {
		// No cerrar a mitad de la petición para no perder la respuesta
		if (isLoading) return;
		onClose();
	}

	async function save(): Promise<Usuario | null> {
		const values = { email, nombre, apellidos, telefono, rol };

		if (usuario) {
			const result = validateSchema(updateUsuarioSchema, values);
			if (!result.success) {
				fieldErrors = result.errors;
				return null;
			}
			fieldErrors = {};
			return usuarioService.update(usuario.id, changes);
		}

		const result = validateSchema(createUsuarioSchema, { ...values, password });
		if (!result.success) {
			fieldErrors = result.errors;
			return null;
		}
		fieldErrors = {};
		return usuarioService.create(result.data);
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		formError = '';
		if (isEdit && !hasChanges) return;

		isLoading = true;
		let saved: Usuario | null = null;
		try {
			saved = await save();
			if (saved) {
				const name = formatFullName(saved);
				alert(
					'success',
					isEdit
						? `Usuario «${name}» actualizado correctamente.`
						: `Usuario «${name}» creado correctamente.`
				);
				onSaved(saved);
			}
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

		if (saved) handleClose();
	}
</script>

<Sheet
	open={isOpen}
	onClose={handleClose}
	dismissible={!isLoading}
	title={isEdit ? 'Editar usuario' : 'Nuevo usuario'}
	description={isEdit
		? 'Modifica los datos del usuario.'
		: 'Crea una cuenta con acceso al panel. Podrás cambiar sus datos después.'}
>
	<form id={FORM_ID} onsubmit={handleSubmit} novalidate class="space-y-4">
		{#if formError}
			<AlertBox>{formError}</AlertBox>
		{/if}

		<fieldset class="space-y-4" disabled={isLoading}>
			<Input
				id="{id}-nombre"
				label="Nombre"
				bind:value={nombre}
				error={fieldErrors.nombre}
				aria-invalid={!!fieldErrors.nombre}
				maxlength={USUARIO_LIMITS.NOMBRE_MAX}
				autocomplete="off"
				required
			/>
			<Input
				id="{id}-apellidos"
				label="Apellidos (opcional)"
				bind:value={apellidos}
				error={fieldErrors.apellidos}
				aria-invalid={!!fieldErrors.apellidos}
				maxlength={USUARIO_LIMITS.APELLIDOS_MAX}
				autocomplete="off"
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
				autocomplete="off"
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
				autocomplete="off"
			/>
			<Select
				id="{id}-rol"
				label="Rol"
				bind:value={rol}
				error={fieldErrors.rol}
				aria-invalid={!!fieldErrors.rol}
				required
			>
				<option value="" disabled>Selecciona un rol</option>
				{#each assignableRoles as value (value)}
					<option {value}>{ROLE_LABEL[value]}</option>
				{/each}
			</Select>
			{#if !isEdit}
				<PasswordInput
					id="{id}-password"
					label="Contraseña"
					bind:value={password}
					error={fieldErrors.password}
					aria-invalid={!!fieldErrors.password}
					maxlength={USUARIO_LIMITS.PASSWORD_MAX}
					autocomplete="new-password"
					placeholder="Entre {USUARIO_LIMITS.PASSWORD_MIN} y {USUARIO_LIMITS.PASSWORD_MAX} caracteres"
					required
				/>
			{/if}
		</fieldset>
	</form>

	{#snippet footer()}
		<div class="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
			{#if isEdit && !hasChanges}
				<p
					class="text-center text-xs text-light-two_d sm:mr-auto sm:text-left dark:text-dark-two_d"
				>
					Modifica algún campo para guardar.
				</p>
			{/if}
			<Button variant="outline" onclick={handleClose} disabled={isLoading} class="w-full sm:w-auto">
				Cancelar
			</Button>
			<Button
				type="submit"
				form={FORM_ID}
				loading={isLoading}
				disabled={isEdit && !hasChanges}
				class="w-full sm:w-auto"
			>
				{isEdit ? 'Guardar cambios' : 'Crear usuario'}
			</Button>
		</div>
	{/snippet}
</Sheet>
