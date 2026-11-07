<script lang="ts">
	import { untrack } from 'svelte';
	import { AlertBox, Button, Input, Select, Sheet } from '#lib/components/ui/index.ts';
	import { ErrorCode } from '#lib/interfaces/index.ts';
	import type { Seccion, UpdateSeccionRequest } from '#lib/interfaces/index.ts';
	import { AppError, errorService, seccionService } from '#lib/services/index.ts';
	import { alert, validateSchema } from '#lib/utils/index.ts';
	import { SECCION_LIMITS, seccionSchema } from '#lib/zod/index.ts';

	interface Props {
		isOpen: boolean;
		/** Si se pasa, el formulario edita esa sección; si no, crea una nueva */
		seccion?: Seccion | null;
		/** Visibilidad preseleccionada al crear (p. ej. la del filtro activo) */
		defaultVisible?: boolean | null;
		onClose: () => void;
		onSaved: (seccion: Seccion) => void;
	}

	let { isOpen, seccion = null, defaultVisible = null, onClose, onSaved }: Props = $props();

	const id = $props.id();
	const FORM_ID = `${id}-form`;

	let nombre = $state('');
	// 'visible' | 'hidden': un select nativo evita crear un componente de interruptor
	let visibility = $state<'visible' | 'hidden'>('visible');
	let isLoading = $state(false);
	let fieldErrors = $state<Record<string, string>>({});
	let formError = $state('');

	const isEdit = $derived(!!seccion);

	// Solo los campos que difieren de la sección original (body del PATCH)
	const changes = $derived.by((): UpdateSeccionRequest => {
		if (!seccion) return {};
		const diff: UpdateSeccionRequest = {};
		const nextVisible = visibility === 'visible';
		if (nombre.trim() !== seccion.nombre) diff.nombre = nombre.trim();
		if (nextVisible !== seccion.is_visible) diff.is_visible = nextVisible;
		return diff;
	});
	const hasChanges = $derived(Object.keys(changes).length > 0);

	function fillForm(source: Seccion | null) {
		nombre = source?.nombre ?? '';
		visibility = (source?.is_visible ?? defaultVisible ?? true) ? 'visible' : 'hidden';
		fieldErrors = {};
		formError = '';
	}

	// Cargar los datos cada vez que se abre (vacío al crear, la sección al editar)
	$effect(() => {
		if (isOpen) untrack(() => fillForm(seccion));
	});

	function handleClose() {
		// No cerrar a mitad de la petición para no perder la respuesta
		if (isLoading) return;
		onClose();
	}

	async function save(): Promise<Seccion | null> {
		const result = validateSchema(seccionSchema, {
			nombre,
			is_visible: visibility === 'visible'
		});
		if (!result.success) {
			fieldErrors = result.errors;
			return null;
		}
		fieldErrors = {};
		return seccion
			? seccionService.update(seccion.id, changes)
			: seccionService.create(result.data);
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		formError = '';
		if (isEdit && !hasChanges) return;

		isLoading = true;
		let saved: Seccion | null = null;
		try {
			saved = await save();
			if (saved) {
				alert(
					'success',
					isEdit
						? `Sección «${saved.nombre}» actualizada correctamente.`
						: `Sección «${saved.nombre}» creada correctamente.`
				);
				onSaved(saved);
			}
		} catch (error) {
			// Errores de validación del backend, para mostrarlos bajo cada campo
			fieldErrors = errorService.getFieldErrors(error);
			// El slug sale del nombre y es único: un conflicto es que ya existe una con ese nombre
			if (error instanceof AppError && error.is(ErrorCode.CONFLICT)) {
				fieldErrors = { ...fieldErrors, nombre: 'Ya existe una sección con este nombre.' };
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
	title={isEdit ? 'Editar sección' : 'Nueva sección'}
	description={isEdit
		? 'Si cambias el nombre, la dirección (slug) de la sección se actualiza.'
		: 'Las secciones agrupan las categorías y los productos de tu catálogo.'}
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
				maxlength={SECCION_LIMITS.NOMBRE_MAX}
				autocomplete="off"
				placeholder="Ej. Mujer"
				required
			/>
			<Select
				id="{id}-visibilidad"
				label="Visibilidad"
				bind:value={visibility}
				error={fieldErrors.is_visible}
				aria-invalid={!!fieldErrors.is_visible}
				required
			>
				<option value="visible">Visible</option>
				<option value="hidden">Oculta</option>
			</Select>
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
				{isEdit ? 'Guardar cambios' : 'Crear sección'}
			</Button>
		</div>
	{/snippet}
</Sheet>
