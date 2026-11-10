<script lang="ts">
	import { CategoriaFormSheet } from '#lib/components/features/panel/categorias/index.ts';
	import { SeccionFormSheet } from '#lib/components/features/panel/secciones/index.ts';
	import { AlertBox, Button } from '#lib/components/ui/index.ts';
	import type {
		Categoria,
		CategoriaItem,
		ProductoDetalle,
		Seccion
	} from '#lib/interfaces/index.ts';
	import { errorService, productoService } from '#lib/services/index.ts';
	import {
		alert,
		buildProductoPatch,
		getCategoriaOptions,
		productoDatosFormSignature,
		toProductoDatosForm,
		validateSchema
	} from '#lib/utils/index.ts';
	import { productoDatosSchema } from '#lib/zod/index.ts';
	import ProductoCategoriasField from './productoCategoriasField.svelte';
	import ProductoDatosSection from './productoDatosSection.svelte';

	interface Props {
		producto: ProductoDetalle;
		secciones: readonly Seccion[];
		/** Catálogo completo de categorías (de todas las secciones) */
		categorias: readonly CategoriaItem[];
		/** Avisa si el formulario tiene cambios sin guardar (para avisar antes de salir de la página) */
		onDirtyChange?: (dirty: boolean) => void;
		/** Responde la ficha completa: el producto se reemplaza entero */
		onSaved: (producto: ProductoDetalle) => void;
		onCancel: () => void;
	}

	let { producto, secciones, categorias, onDirtyChange, onSaved, onCancel }: Props = $props();

	const id = $props.id();
	const FORM_ID = `${id}-form`;

	// El editor se monta al abrirse y se desmonta al cerrar: el estado inicial solo se lee una vez
	// svelte-ignore state_referenced_locally
	let values = $state(toProductoDatosForm(producto));
	// svelte-ignore state_referenced_locally
	const initialSignature = productoDatosFormSignature(values);

	let errors = $state<Record<string, string>>({});
	let formError = $state('');
	let isSaving = $state(false);
	let createdSecciones = $state<Seccion[]>([]);
	let createdCategorias = $state<CategoriaItem[]>([]);
	let isSeccionOpen = $state(false);
	let isCategoriaOpen = $state(false);

	const todasSecciones = $derived([...secciones, ...createdSecciones]);
	const catalogo = $derived([...categorias, ...createdCategorias]);
	const categoriaOptions = $derived(
		getCategoriaOptions(catalogo, values.seccion_id, { onlyLeaf: true })
	);
	const hasChanges = $derived(productoDatosFormSignature(values) !== initialSignature);
	// Al cambiar de sección las categorías actuales dejan de valer (pertenecen a la anterior)
	const seccionCambiada = $derived(
		values.seccion_id !== producto.seccion_id && producto.categorias.length > 0
	);

	$effect(() => {
		onDirtyChange?.(hasChanges);
	});

	function handleSeccionChange(seccionId: string) {
		if (seccionId === values.seccion_id) return;
		values.seccion_id = seccionId;
		values.categoria_ids = [];
	}

	function handleSeccionCreated(saved: Seccion) {
		createdSecciones.push(saved);
		handleSeccionChange(saved.id);
	}

	function handleCategoriaCreated(saved: Categoria) {
		createdCategorias.push(saved);
		// Si se creó dentro de otra categoría, esa deja de ser hoja: ya no admite productos
		const selected = values.categoria_ids.filter((categoriaId) => categoriaId !== saved.parent_id);
		values.categoria_ids = [...selected, saved.id];
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		formError = '';
		if (!hasChanges) return;

		const result = validateSchema(productoDatosSchema, values);
		if (!result.success) {
			errors = result.errors;
			return;
		}
		errors = {};

		const patch = buildProductoPatch(producto, result.data);
		if (Object.keys(patch).length === 0) {
			onCancel();
			return;
		}

		isSaving = true;
		try {
			const saved = await productoService.update(producto.id, patch);
			onDirtyChange?.(false);
			alert('success', `Producto «${saved.nombre}» actualizado.`);
			onSaved(saved);
		} catch (error) {
			errors = errorService.getFieldErrors(error);
			formError = Object.keys(errors).length > 0 ? '' : errorService.getMessage(error);
		} finally {
			isSaving = false;
		}
	}
</script>

<form
	id={FORM_ID}
	onsubmit={handleSubmit}
	novalidate
	class="space-y-5 border-2 border-light-three bg-light-one p-4 sm:p-6 dark:border-dark-three dark:bg-dark-one"
	aria-label="Editar datos generales"
>
	<h2 class="text-base font-semibold text-light-two dark:text-dark-two">Editar datos generales</h2>

	{#if formError}
		<AlertBox>{formError}</AlertBox>
	{/if}

	<ProductoDatosSection
		bind:values
		secciones={todasSecciones}
		{errors}
		disabled={isSaving}
		onSeccionChange={handleSeccionChange}
		onCreateSeccion={() => (isSeccionOpen = true)}
	/>

	<div>
		<h3 class="mb-2 text-sm font-semibold text-light-two dark:text-dark-two">Categorías</h3>
		{#if seccionCambiada}
			<AlertBox variant="warning" class="mb-3">
				Cambiaste la sección: las categorías anteriores se quitarán al guardar. Elige las de la
				nueva sección.
			</AlertBox>
		{/if}
		<ProductoCategoriasField
			options={categoriaOptions}
			bind:selected={values.categoria_ids}
			hasSeccion={!!values.seccion_id}
			disabled={isSaving}
			error={errors.categoria_ids}
			onCreate={() => (isCategoriaOpen = true)}
		/>
	</div>

	<div class="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
		{#if !hasChanges}
			<p class="text-center text-xs text-light-two_d sm:mr-auto sm:text-left dark:text-dark-two_d">
				Modifica algún campo para guardar.
			</p>
		{/if}
		<Button variant="outline" onclick={onCancel} disabled={isSaving} class="w-full sm:w-auto">
			Cancelar
		</Button>
		<Button type="submit" loading={isSaving} disabled={!hasChanges} class="w-full sm:w-auto">
			Guardar cambios
		</Button>
	</div>
</form>

<!-- Fuera del <form>: los diálogos traen su propio formulario y no pueden anidarse -->
<SeccionFormSheet
	isOpen={isSeccionOpen}
	onClose={() => (isSeccionOpen = false)}
	onSaved={handleSeccionCreated}
/>

<CategoriaFormSheet
	isOpen={isCategoriaOpen}
	secciones={todasSecciones}
	categorias={catalogo}
	defaultSeccionId={values.seccion_id}
	lockSeccion
	onClose={() => (isCategoriaOpen = false)}
	onSaved={handleCategoriaCreated}
/>
