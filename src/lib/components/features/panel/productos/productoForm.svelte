<script lang="ts">
	import { tick } from 'svelte';
	import { beforeNavigate, goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { AlertBox, Button, ModalConfirm } from '#lib/components/ui/index.ts';
	import { PlusIcon } from '#lib/icons/outline/index.ts';
	import { CategoriaFormSheet } from '#lib/components/features/panel/categorias/index.ts';
	import { ColorFormSheet } from '#lib/components/features/panel/colores/index.ts';
	import { SeccionFormSheet } from '#lib/components/features/panel/secciones/index.ts';
	import type {
		Categoria,
		CategoriaItem,
		Color,
		ProductoDetalle,
		ProductoFormValues,
		Seccion,
		Talla
	} from '#lib/interfaces/index.ts';
	import { errorService, productoService } from '#lib/services/index.ts';
	import {
		alert,
		createProductoColor,
		createProductoFormValues,
		getCategoriaOptions,
		hasFailedUploads,
		hasPendingUploads,
		isProductoFormDirty,
		scrollToCenter,
		toProductoInput,
		validateSchemaDeep
	} from '#lib/utils/index.ts';
	import { productoSchema } from '#lib/zod/index.ts';
	import ProductoCategoriasField from './productoCategoriasField.svelte';
	import ProductoColorCard from './productoColorCard.svelte';
	import ProductoDatosSection from './productoDatosSection.svelte';

	interface Props {
		secciones: readonly Seccion[];
		/** Catálogo completo de categorías (de todas las secciones) */
		categorias: readonly CategoriaItem[];
		colores: readonly Color[];
		tallas: readonly Talla[];
		/** Sección preseleccionada */
		defaultSeccionId?: string;
		onCreated: (producto: ProductoDetalle) => void;
	}

	let {
		secciones,
		categorias,
		colores,
		tallas,
		defaultSeccionId = '',
		onCreated
	}: Props = $props();

	const id = $props.id();
	const FORM_ID = `${id}-form`;
	const BASE =
		'border border-light-one_d bg-light-one p-4 sm:p-6 dark:border-dark-one_d dark:bg-dark-one';

	// Solo se lee al abrir el formulario: la sección preseleccionada no se vuelve a aplicar después
	// svelte-ignore state_referenced_locally
	let values = $state<ProductoFormValues>(createProductoFormValues(defaultSeccionId));
	let errors = $state<Record<string, string>>({});
	let formError = $state('');
	let isSaving = $state(false);
	// Aviso al salir con cambios sin guardar (ver más abajo)
	let allowLeave = $state(false);
	let leaveTo = $state<URL | null>(null);

	// Categorías creadas desde este formulario: se suman al catálogo recibido sin volver a pedirlo
	let createdCategorias = $state<CategoriaItem[]>([]);
	let createdSecciones = $state<Seccion[]>([]);
	let createdColores = $state<Color[]>([]);
	let isCategoriaOpen = $state(false);
	let isSeccionOpen = $state(false);
	let isColorOpen = $state(false);

	const catalogo = $derived([...categorias, ...createdCategorias]);
	const todasSecciones = $derived([...secciones, ...createdSecciones]);
	const todosColores = $derived([...colores, ...createdColores]);
	const isUploading = $derived(hasPendingUploads(values));
	const categoriaOptions = $derived(
		getCategoriaOptions(catalogo, values.seccion_id, { onlyLeaf: true })
	);
	const usedColorIds = $derived(values.colores.map((color) => color.color_id).filter(Boolean));
	const canAddColor = $derived(todosColores.length > values.colores.length);

	// La categoría pertenece a una sección: al cambiarla se descartan las ya elegidas
	function handleSeccionChange(seccionId: string) {
		if (seccionId === values.seccion_id) return;
		values.seccion_id = seccionId;
		values.categoria_ids = [];
	}

	// La categoría recién creada queda disponible y marcada para este producto
	function handleCategoriaCreated(saved: Categoria) {
		createdCategorias.push(saved);
		// Si se creó dentro de otra categoría, esa deja de ser hoja: ya no admite productos
		const selected = values.categoria_ids.filter((categoriaId) => categoriaId !== saved.parent_id);
		values.categoria_ids = [...selected, saved.id];
	}

	// La sección recién creada queda elegida (lo que descarta las categorías de la anterior)
	function handleSeccionCreated(saved: Seccion) {
		createdSecciones.push(saved);
		handleSeccionChange(saved.id);
	}

	// El color recién creado se agrega al producto: ocupa la primera tarjeta sin color o abre una nueva
	function handleColorCreated(saved: Color) {
		createdColores.push(saved);
		const empty = values.colores.find((color) => !color.color_id);
		if (empty) empty.color_id = saved.id;
		else values.colores.push(createProductoColor(saved.id));
	}

	function removeColor(key: string) {
		values.colores = values.colores.filter((color) => color.key !== key);
	}

	// Lleva la vista al primer campo con error. No usar `scrollIntoView`: desplaza también los
	// contenedores `overflow-hidden` del layout del panel y descoloca la tarjeta principal
	async function focusFirstError() {
		await tick();
		const field = document.querySelector<HTMLElement>(
			`#${CSS.escape(FORM_ID)} [aria-invalid="true"]`
		);
		if (field) scrollToCenter(field);
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		formError = '';
		errors = {};

		if (hasFailedUploads(values)) {
			formError = 'Hay imágenes que no se pudieron subir. Quítalas o vuelve a intentarlo.';
			return;
		}

		const result = validateSchemaDeep(productoSchema, toProductoInput(values));
		if (!result.success) {
			errors = result.errors;
			formError = 'Revisa los campos marcados.';
			focusFirstError();
			return;
		}

		isSaving = true;
		try {
			const created = await productoService.create(result.data);
			// Ya está guardado: salir de la página no debe pedir confirmación
			allowLeave = true;
			alert('success', `Producto «${created.nombre}» creado correctamente.`);
			onCreated(created);
		} catch (error) {
			// Errores de validación del backend, para los campos de la primera parte del formulario
			const apiErrors = errorService.getFieldErrors(error);
			errors = {
				...(apiErrors.seccion_id && { seccion_id: apiErrors.seccion_id }),
				...(apiErrors.nombre && { nombre: apiErrors.nombre }),
				...(apiErrors.descripcion && { descripcion: apiErrors.descripcion }),
				...(apiErrors.cuidados && { cuidados: apiErrors.cuidados }),
				...(apiErrors.composicion && { composicion: apiErrors.composicion })
			};
			formError = errorService.getMessage(error);
			focusFirstError();
		} finally {
			isSaving = false;
		}
	}

	// ── Aviso al salir con cambios sin guardar ─────────────────────────────────────────────────
	beforeNavigate(({ cancel, to, willUnload }) => {
		if (allowLeave || isSaving || !isProductoFormDirty(values)) return;
		// Al cerrar o recargar la pestaña, el navegador muestra su propio aviso
		cancel();
		if (!willUnload && to) leaveTo = to.url;
	});

	function confirmLeave() {
		const target = leaveTo;
		allowLeave = true;
		leaveTo = null;
		// `target` es la URL interna que SvelteKit ya resolvió al cancelar la navegación
		// eslint-disable-next-line svelte/no-navigation-without-resolve
		if (target) goto(target);
	}
</script>

<form id={FORM_ID} onsubmit={handleSubmit} novalidate class="space-y-4">
	{#if formError}
		<AlertBox>{formError}</AlertBox>
	{/if}

	<section class={BASE} aria-labelledby="{id}-datos">
		<h2 id="{id}-datos" class="mb-4 text-base font-semibold text-light-two dark:text-dark-two">
			Datos generales
		</h2>
		<ProductoDatosSection
			bind:values
			secciones={todasSecciones}
			{errors}
			disabled={isSaving}
			onSeccionChange={handleSeccionChange}
			onCreateSeccion={() => (isSeccionOpen = true)}
		/>
	</section>

	<section class={BASE} aria-labelledby="{id}-categorias">
		<h2 id="{id}-categorias" class="mb-4 text-base font-semibold text-light-two dark:text-dark-two">
			Categorías
		</h2>
		<ProductoCategoriasField
			options={categoriaOptions}
			bind:selected={values.categoria_ids}
			hasSeccion={!!values.seccion_id}
			disabled={isSaving}
			error={errors.categoria_ids}
			onCreate={() => (isCategoriaOpen = true)}
		/>
	</section>

	<section class={BASE} aria-labelledby="{id}-colores">
		<div class="mb-4 flex flex-wrap items-start justify-between gap-3">
			<div>
				<h2 id="{id}-colores" class="text-base font-semibold text-light-two dark:text-dark-two">
					Colores, imágenes y tallas
				</h2>
				<p class="text-xs text-light-two_d dark:text-dark-two_d">
					Cada color tiene su galería de imágenes y sus tallas con precio y stock.
				</p>
			</div>
			<div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
				<Button
					variant="outline"
					onclick={() => (isColorOpen = true)}
					disabled={isSaving}
					class="w-full sm:w-auto"
				>
					{#snippet leftIcon()}<PlusIcon class="size-4" />{/snippet}
					Crear color
				</Button>
				<Button
					variant="outline"
					onclick={() => values.colores.push(createProductoColor())}
					disabled={isSaving || !canAddColor}
					class="w-full sm:w-auto"
				>
					{#snippet leftIcon()}<PlusIcon class="size-4" />{/snippet}
					Agregar color
				</Button>
			</div>
		</div>

		{#if todosColores.length === 0}
			<p class="mb-3 text-sm text-light-two_d dark:text-dark-two_d">
				Aún no hay colores registrados: crea el primero con «Crear color».
			</p>
		{:else if values.colores.length === 0}
			<p class="text-sm text-light-two_d dark:text-dark-two_d">
				Sin colores el producto se crea solo con sus datos generales.
			</p>
		{/if}

		<div class="space-y-4">
			{#each values.colores as color, index (color.key)}
				<ProductoColorCard
					bind:color={values.colores[index]}
					position={index + 1}
					colores={todosColores}
					{usedColorIds}
					{tallas}
					path="colores.{index}"
					{errors}
					disabled={isSaving}
					onRemove={() => removeColor(color.key)}
				/>
			{/each}
		</div>
	</section>

	<!-- Barra de acciones fija al pie de la tarjeta con scroll -->
	<div
		class="sticky bottom-0 z-10 flex flex-col-reverse gap-2 border-t border-light-one_d bg-light-one/95 p-3 backdrop-blur sm:flex-row sm:items-center sm:justify-end dark:border-dark-one_d dark:bg-dark-one/95"
	>
		{#if isUploading}
			<p class="text-center text-xs text-light-two_d sm:mr-auto sm:text-left dark:text-dark-two_d">
				Espera a que terminen de subirse las imágenes.
			</p>
		{/if}
		<Button
			variant="outline"
			href={resolve('/panel/productos')}
			disabled={isSaving}
			class="w-full sm:w-auto"
		>
			Cancelar
		</Button>
		<Button
			type="submit"
			form={FORM_ID}
			loading={isSaving}
			disabled={isUploading}
			class="w-full sm:w-auto"
		>
			Crear producto
		</Button>
	</div>
</form>

<!-- Fuera del <form>: el diálogo trae su propio formulario y no pueden anidarse -->
<SeccionFormSheet
	isOpen={isSeccionOpen}
	onClose={() => (isSeccionOpen = false)}
	onSaved={handleSeccionCreated}
/>

<ColorFormSheet
	isOpen={isColorOpen}
	onClose={() => (isColorOpen = false)}
	onSaved={handleColorCreated}
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

<ModalConfirm
	isOpen={!!leaveTo}
	message="Tienes cambios sin guardar en este producto. Si sales ahora se perderán. ¿Salir de todas formas?"
	onConfirm={confirmLeave}
	onCancel={() => (leaveTo = null)}
/>
