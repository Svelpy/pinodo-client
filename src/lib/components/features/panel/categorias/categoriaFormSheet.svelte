<script lang="ts">
	import { untrack } from 'svelte';
	import { AlertBox, Button, Input, Select, Sheet } from '#lib/components/ui/index.ts';
	import type {
		Categoria,
		CategoriaItem,
		CategoriaOption,
		Seccion,
		UpdateCategoriaRequest
	} from '#lib/interfaces/index.ts';
	import { categoriaService, errorService } from '#lib/services/index.ts';
	import { alert, getCategoriaPath, getDescendantIds, validateSchema } from '#lib/utils/index.ts';
	import { CATEGORIA_LIMITS, categoriaSchema } from '#lib/zod/index.ts';

	interface Props {
		isOpen: boolean;
		/** Si se pasa, el formulario edita esa categoría; si no, crea una nueva */
		categoria?: CategoriaItem | null;
		secciones: readonly Seccion[];
		/** Todas las categorías (sin filtros), para elegir la categoría padre */
		categorias: readonly CategoriaItem[];
		/** Error al cargar las secciones o categorías: sin ellas no se puede elegir sección ni padre */
		catalogError?: string;
		/** Valores preseleccionados al crear (p. ej. los filtros activos) */
		defaultSeccionId?: string | null;
		defaultParentId?: string | null;
		/** La sección no se puede cambiar (p. ej. al crear desde un producto, que ya tiene la suya) */
		lockSeccion?: boolean;
		onClose: () => void;
		onSaved: (categoria: Categoria) => void;
	}

	let {
		isOpen,
		categoria = null,
		secciones,
		categorias,
		catalogError = '',
		defaultSeccionId = null,
		defaultParentId = null,
		lockSeccion = false,
		onClose,
		onSaved
	}: Props = $props();

	const id = $props.id();
	const FORM_ID = `${id}-form`;

	let nombre = $state('');
	let seccionId = $state('');
	// '' = categoría raíz (sin padre)
	let parentId = $state('');
	// 'visible' | 'hidden': un select nativo evita crear un componente de interruptor
	let visibility = $state<'visible' | 'hidden'>('visible');
	let isLoading = $state(false);
	let fieldErrors = $state<Record<string, string>>({});
	let formError = $state('');

	const isEdit = $derived(!!categoria);

	// Posibles padres: de la misma sección, sin la propia categoría ni sus descendientes (evita ciclos)
	const parentOptions = $derived.by((): CategoriaOption[] => {
		if (!seccionId) return [];
		const excluded = categoria ? getDescendantIds(categorias, categoria.id) : null;
		return categorias
			.filter(
				(item) =>
					item.seccion_id === seccionId && item.id !== categoria?.id && !excluded?.has(item.id)
			)
			.map((item) => ({ id: item.id, label: getCategoriaPath(categorias, item.id) }))
			.sort((a, b) => a.label.localeCompare(b.label, 'es'));
	});

	// Solo los campos que difieren de la categoría original (body del PATCH)
	const changes = $derived.by((): UpdateCategoriaRequest => {
		if (!categoria) return {};
		const diff: UpdateCategoriaRequest = {};
		const nextVisible = visibility === 'visible';
		const nextParent = parentId || null;
		if (nombre.trim() !== categoria.nombre) diff.nombre = nombre.trim();
		if (seccionId !== categoria.seccion_id) diff.seccion_id = seccionId;
		if (nextParent !== categoria.parent_id) diff.parent_id = nextParent;
		if (nextVisible !== categoria.is_visible) diff.is_visible = nextVisible;
		return diff;
	});
	const hasChanges = $derived(Object.keys(changes).length > 0);

	function fillForm(source: CategoriaItem | null) {
		nombre = source?.nombre ?? '';
		seccionId = source?.seccion_id ?? defaultSeccionId ?? '';
		parentId = source ? (source.parent_id ?? '') : (defaultParentId ?? '');
		visibility = (source?.is_visible ?? true) ? 'visible' : 'hidden';
		fieldErrors = {};
		formError = '';
	}

	// Cargar los datos cada vez que se abre (vacío al crear, la categoría al editar)
	$effect(() => {
		if (isOpen) untrack(() => fillForm(categoria));
	});

	// El padre debe ser de la misma sección: al cambiarla se descarta el padre elegido
	function handleSeccionChange(event: Event & { currentTarget: HTMLSelectElement }) {
		seccionId = event.currentTarget.value;
		parentId = '';
	}

	function handleClose() {
		// No cerrar a mitad de la petición para no perder la respuesta
		if (isLoading) return;
		onClose();
	}

	async function save(): Promise<Categoria | null> {
		const result = validateSchema(categoriaSchema, {
			nombre,
			seccion_id: seccionId,
			parent_id: parentId,
			is_visible: visibility === 'visible'
		});
		if (!result.success) {
			fieldErrors = result.errors;
			return null;
		}
		fieldErrors = {};
		return categoria
			? categoriaService.update(categoria.id, changes)
			: categoriaService.create(result.data);
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		formError = '';
		if (isEdit && !hasChanges) return;

		isLoading = true;
		let saved: Categoria | null = null;
		try {
			saved = await save();
			if (saved) {
				alert(
					'success',
					isEdit
						? `Categoría «${saved.nombre}» actualizada correctamente.`
						: `Categoría «${saved.nombre}» creada correctamente.`
				);
				onSaved(saved);
			}
		} catch (error) {
			// Errores de validación del backend, para mostrarlos bajo cada campo. Los 409 (nombre repetido
			// en la sección, padre con productos, cambio de sección no permitido) traen su propio mensaje
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
	title={isEdit ? 'Editar categoría' : 'Nueva categoría'}
	description={isEdit
		? 'Si cambias el nombre o la sección, la dirección (slug) de la categoría se actualiza.'
		: 'Las categorías ordenan los productos de una sección. Puedes anidarlas dentro de otra categoría.'}
>
	<form id={FORM_ID} onsubmit={handleSubmit} novalidate class="space-y-4">
		{#if catalogError}
			<AlertBox>
				No se pudieron cargar las secciones y categorías: {catalogError}
			</AlertBox>
		{:else if secciones.length === 0}
			<AlertBox>Primero crea una sección: toda categoría pertenece a una.</AlertBox>
		{/if}

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
				maxlength={CATEGORIA_LIMITS.NOMBRE_MAX}
				autocomplete="off"
				placeholder="Ej. Bombers"
				required
			/>
			<Select
				id="{id}-seccion"
				label="Sección"
				value={seccionId}
				onchange={handleSeccionChange}
				error={fieldErrors.seccion_id}
				aria-invalid={!!fieldErrors.seccion_id}
				disabled={lockSeccion}
				required
			>
				<option value="" disabled>Selecciona una sección</option>
				{#each secciones as seccion (seccion.id)}
					<option value={seccion.id}>{seccion.nombre}</option>
				{/each}
			</Select>
			<Select
				id="{id}-padre"
				label="Categoría padre (opcional)"
				bind:value={parentId}
				disabled={!seccionId}
				error={fieldErrors.parent_id}
				aria-invalid={!!fieldErrors.parent_id}
			>
				<option value="">Ninguna (categoría principal)</option>
				{#each parentOptions as option (option.id)}
					<option value={option.id}>{option.label}</option>
				{/each}
			</Select>
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
				disabled={(isEdit && !hasChanges) || secciones.length === 0}
				class="w-full sm:w-auto"
			>
				{isEdit ? 'Guardar cambios' : 'Crear categoría'}
			</Button>
		</div>
	{/snippet}
</Sheet>
