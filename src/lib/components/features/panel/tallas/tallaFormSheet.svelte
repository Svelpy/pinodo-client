<script lang="ts">
	import { untrack } from 'svelte';
	import { AlertBox, Button, Input, Sheet } from '#lib/components/ui/index.ts';
	import { ErrorCode } from '#lib/interfaces/index.ts';
	import type { Talla } from '#lib/interfaces/index.ts';
	import { AppError, errorService, tallaService } from '#lib/services/index.ts';
	import { alert, validateSchema } from '#lib/utils/index.ts';
	import { TALLA_LIMITS, tallaSchema } from '#lib/zod/index.ts';

	interface Props {
		isOpen: boolean;
		/** Si se pasa, el formulario edita esa talla; si no, crea una nueva */
		talla?: Talla | null;
		onClose: () => void;
		onSaved: (talla: Talla) => void;
	}

	let { isOpen, talla = null, onClose, onSaved }: Props = $props();

	const id = $props.id();
	const FORM_ID = `${id}-form`;

	let etiqueta = $state('');
	let isLoading = $state(false);
	let fieldErrors = $state<Record<string, string>>({});
	let formError = $state('');

	const isEdit = $derived(!!talla);

	// La única propiedad editable es la etiqueta: hay cambios si es distinta de la original
	const hasChanges = $derived(!!talla && etiqueta.trim() !== talla.etiqueta);

	function fillForm(source: Talla | null) {
		etiqueta = source?.etiqueta ?? '';
		fieldErrors = {};
		formError = '';
	}

	// Cargar los datos cada vez que se abre (vacío al crear, la talla al editar)
	$effect(() => {
		if (isOpen) untrack(() => fillForm(talla));
	});

	function handleClose() {
		// No cerrar a mitad de la petición para no perder la respuesta
		if (isLoading) return;
		onClose();
	}

	async function save(): Promise<Talla | null> {
		const result = validateSchema(tallaSchema, { etiqueta });
		if (!result.success) {
			fieldErrors = result.errors;
			return null;
		}
		fieldErrors = {};
		// El PATCH envía solo lo modificado: aquí la etiqueta, que ya se comprobó que cambió
		return talla ? tallaService.update(talla.id, result.data) : tallaService.create(result.data);
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		formError = '';
		if (isEdit && !hasChanges) return;

		isLoading = true;
		let saved: Talla | null = null;
		try {
			saved = await save();
			if (saved) {
				alert(
					'success',
					isEdit
						? `Talla «${saved.etiqueta}» actualizada correctamente.`
						: `Talla «${saved.etiqueta}» creada correctamente.`
				);
				onSaved(saved);
			}
		} catch (error) {
			// Errores de validación del backend, para mostrarlos bajo cada campo
			fieldErrors = errorService.getFieldErrors(error);
			// La etiqueta es el único dato único (sin distinguir mayúsculas): un conflicto es una repetida
			if (error instanceof AppError && error.is(ErrorCode.CONFLICT)) {
				fieldErrors = { ...fieldErrors, etiqueta: 'Ya existe una talla con esta etiqueta.' };
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
	title={isEdit ? 'Editar talla' : 'Nueva talla'}
	description={isEdit
		? 'Modifica la etiqueta de la talla.'
		: 'Las tallas se asignan a los SKUs de los productos. La etiqueta no puede repetirse, aunque cambien las mayúsculas.'}
>
	<form id={FORM_ID} onsubmit={handleSubmit} novalidate class="space-y-4">
		{#if formError}
			<AlertBox>{formError}</AlertBox>
		{/if}

		<fieldset class="space-y-4" disabled={isLoading}>
			<Input
				id="{id}-etiqueta"
				label="Etiqueta"
				bind:value={etiqueta}
				error={fieldErrors.etiqueta}
				aria-invalid={!!fieldErrors.etiqueta}
				maxlength={TALLA_LIMITS.ETIQUETA_MAX}
				autocomplete="off"
				placeholder="Ej. M, 42 o 6-7 años"
				required
			/>
		</fieldset>
	</form>

	{#snippet footer()}
		<div class="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
			{#if isEdit && !hasChanges}
				<p
					class="text-center text-xs text-light-two_d sm:mr-auto sm:text-left dark:text-dark-two_d"
				>
					Modifica la etiqueta para guardar.
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
				{isEdit ? 'Guardar cambios' : 'Crear talla'}
			</Button>
		</div>
	{/snippet}
</Sheet>
