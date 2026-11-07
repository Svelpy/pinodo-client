<script lang="ts">
	import { untrack } from 'svelte';
	import { AlertBox, Button, Input, Sheet } from '#lib/components/ui/index.ts';
	import { ErrorCode } from '#lib/interfaces/index.ts';
	import type { Color, UpdateColorRequest } from '#lib/interfaces/index.ts';
	import { AppError, colorService, errorService } from '#lib/services/index.ts';
	import { alert, validateSchema } from '#lib/utils/index.ts';
	import { COLOR_LIMITS, colorSchema, isHexColor, normalizeHexColor } from '#lib/zod/index.ts';

	interface Props {
		isOpen: boolean;
		/** Si se pasa, el formulario edita ese color; si no, crea uno nuevo */
		color?: Color | null;
		onClose: () => void;
		onSaved: (color: Color, previous: Color | null) => void;
	}

	let { isOpen, color = null, onClose, onSaved }: Props = $props();

	const id = $props.id();
	const FORM_ID = `${id}-form`;

	let nombre = $state('');
	let codigoHex = $state('');
	let isLoading = $state(false);
	let fieldErrors = $state<Record<string, string>>({});
	let formError = $state('');

	const isEdit = $derived(!!color);

	// El selector nativo solo acepta #rrggbb: mientras el texto no sea válido muestra negro
	const pickerValue = $derived(isHexColor(codigoHex) ? normalizeHexColor(codigoHex) : '#000000');

	// Solo los campos que difieren del color original (body del PATCH)
	const changes = $derived.by((): UpdateColorRequest => {
		if (!color) return {};
		const diff: UpdateColorRequest = {};
		if (nombre.trim() !== color.nombre) diff.nombre = nombre.trim();
		const nextHex = normalizeHexColor(codigoHex);
		if (nextHex !== normalizeHexColor(color.codigo_hex)) diff.codigo_hex = nextHex;
		return diff;
	});
	const hasChanges = $derived(Object.keys(changes).length > 0);

	function fillForm(source: Color | null) {
		nombre = source?.nombre ?? '';
		codigoHex = source?.codigo_hex ?? '';
		fieldErrors = {};
		formError = '';
	}

	// Cargar los datos cada vez que se abre (vacío al crear, el color al editar)
	$effect(() => {
		if (isOpen) untrack(() => fillForm(color));
	});

	function handleClose() {
		// No cerrar a mitad de la petición para no perder la respuesta
		if (isLoading) return;
		onClose();
	}

	async function save(): Promise<Color | null> {
		const result = validateSchema(colorSchema, { nombre, codigo_hex: codigoHex });
		if (!result.success) {
			fieldErrors = result.errors;
			return null;
		}
		fieldErrors = {};
		return color ? colorService.update(color.id, changes) : colorService.create(result.data);
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		formError = '';
		if (isEdit && !hasChanges) return;

		isLoading = true;
		const previous = color;
		let saved: Color | null = null;
		try {
			saved = await save();
			if (saved) {
				alert(
					'success',
					isEdit
						? `Color «${saved.nombre}» actualizado correctamente.`
						: `Color «${saved.nombre}» creado correctamente.`
				);
				onSaved(saved, previous);
			}
		} catch (error) {
			// Errores de validación del backend, para mostrarlos bajo cada campo
			fieldErrors = errorService.getFieldErrors(error);
			// El nombre es el único dato único (se compara su slug): un conflicto es un nombre repetido
			if (error instanceof AppError && error.is(ErrorCode.CONFLICT)) {
				fieldErrors = { ...fieldErrors, nombre: 'Ya existe un color con este nombre.' };
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
	title={isEdit ? 'Editar color' : 'Nuevo color'}
	description={isEdit
		? 'Si cambias el nombre, la dirección (slug) del color se actualiza.'
		: 'Los colores se asignan a los productos. El nombre no puede repetirse, aunque cambien mayúsculas o tildes.'}
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
				maxlength={COLOR_LIMITS.NOMBRE_MAX}
				autocomplete="off"
				placeholder="Ej. Azul marino"
				required
			/>
			<Input
				id="{id}-hex"
				label="Código de color"
				bind:value={codigoHex}
				error={fieldErrors.codigo_hex}
				aria-invalid={!!fieldErrors.codigo_hex}
				maxlength={COLOR_LIMITS.HEX_LENGTH}
				autocomplete="off"
				spellcheck="false"
				placeholder="#1E3A8A"
				required
			>
				{#snippet trailing()}
					<!-- Selector nativo de color: al elegir, rellena el texto en mayúsculas -->
					<input
						type="color"
						aria-label="Elegir color"
						value={pickerValue}
						oninput={(event) => (codigoHex = event.currentTarget.value.toUpperCase())}
						class="size-8 cursor-pointer border-0 bg-transparent p-0 [&::-moz-color-swatch]:border-0 [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
					/>
				{/snippet}
			</Input>
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
				{isEdit ? 'Guardar cambios' : 'Crear color'}
			</Button>
		</div>
	{/snippet}
</Sheet>
