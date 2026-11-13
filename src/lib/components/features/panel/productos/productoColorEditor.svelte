<script lang="ts">
	import { onMount } from 'svelte';
	import { ColorFormSheet } from '#lib/components/features/panel/colores/index.ts';
	import { AlertBox, Button } from '#lib/components/ui/index.ts';
	import { PlusIcon } from '#lib/icons/outline/index.ts';
	import type { Color, ProductoColor, Talla } from '#lib/interfaces/index.ts';
	import { errorService, kardexService, productoColorService } from '#lib/services/index.ts';
	import {
		alert,
		aplicarCostosActuales,
		buildProductoColorPatch,
		costosActuales,
		createProductoColor,
		hasFailedUploads,
		hasPendingUploads,
		productoColorFormSignature,
		toAddProductoColorRequest,
		toProductoColorForm,
		toProductoColorInput,
		validateSchemaDeep
	} from '#lib/utils/index.ts';
	import { productoColorSchema } from '#lib/zod/index.ts';
	import ProductoColorCard from './productoColorCard.svelte';

	interface Props {
		productoId: string;
		/** Color a editar; null = añadir uno nuevo al producto */
		color: ProductoColor | null;
		/** Catálogo de colores y tallas */
		colores: readonly Color[];
		tallas: readonly Talla[];
		/** Colores que ya usan los demás colores del producto (no se pueden repetir) */
		usedColorIds: readonly string[];
		/** Avisa si el formulario tiene cambios sin guardar (para avisar antes de salir de la página) */
		onDirtyChange?: (dirty: boolean) => void;
		onSaved: (color: ProductoColor) => void;
		onCancel: () => void;
	}

	let {
		productoId,
		color,
		colores,
		tallas,
		usedColorIds,
		onDirtyChange,
		onSaved,
		onCancel
	}: Props = $props();

	const id = $props.id();
	const FORM_ID = `${id}-form`;
	// Las claves de error del schema (`skus.0.talla_id`) se prefijan para la tarjeta del color
	const PATH = 'color';

	// El editor se monta al abrirse y se desmonta al cerrar: el estado inicial solo se lee una vez
	// svelte-ignore state_referenced_locally
	let form = $state(color ? toProductoColorForm(color) : createProductoColor());
	// svelte-ignore state_referenced_locally
	const initialSignature = productoColorFormSignature(form);

	let errors = $state<Record<string, string>>({});
	let formError = $state('');
	let isSaving = $state(false);
	let isColorOpen = $state(false);
	let createdColores = $state<Color[]>([]);
	let costosError = $state(false);

	const isNew = $derived(!color);
	const todosColores = $derived([...colores, ...createdColores]);
	const isUploading = $derived(hasPendingUploads({ colores: [form] }));
	const hasChanges = $derived(productoColorFormSignature(form) !== initialSignature);

	$effect(() => {
		onDirtyChange?.(hasChanges);
	});

	// La respuesta del SKU no trae su costo: se lee del kardex para poder corregirlo. Si falla, las
	// tallas guardadas simplemente no muestran el costo y nunca se envía
	onMount(() => {
		const original = color;
		if (!original || original.skus.length === 0) return;
		kardexService
			.costos({ producto_id: productoId, color_id: original.color_id, per_page: 100 })
			.then(({ data }) => {
				const costos = new Map(data.map((item) => [item.sku_id, item.costo]));
				form.skus = aplicarCostosActuales(form.skus, costos);
			})
			.catch(() => (costosError = true));
	});

	function handleColorCreated(saved: Color) {
		createdColores.push(saved);
		form.color_id = saved.id;
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		formError = '';
		errors = {};
		if (!hasChanges && !isNew) return;

		if (hasFailedUploads({ colores: [form] })) {
			formError = 'Hay imágenes que no se pudieron subir. Quítalas o vuelve a intentarlo.';
			return;
		}

		const result = validateSchemaDeep(productoColorSchema, toProductoColorInput(form));
		if (!result.success) {
			errors = Object.fromEntries(
				Object.entries(result.errors).map(([key, message]) => [`${PATH}.${key}`, message])
			);
			formError = 'Revisa los campos marcados.';
			return;
		}

		isSaving = true;
		try {
			let saved: ProductoColor;
			if (color) {
				const patch = buildProductoColorPatch(color, result.data, costosActuales(form.skus));
				if (Object.keys(patch).length === 0) {
					onCancel();
					return;
				}
				saved = await productoColorService.update(color.id, patch);
			} else {
				saved = await productoColorService.create(
					toAddProductoColorRequest(productoId, result.data)
				);
			}
			onDirtyChange?.(false);
			alert(
				'success',
				isNew
					? `Color «${saved.color.nombre}» añadido al producto.`
					: `Color «${saved.color.nombre}» actualizado.`
			);
			onSaved(saved);
		} catch (error) {
			// 409: el producto ya tiene ese color, o una talla / código de barras repetido
			formError = errorService.getMessage(error);
		} finally {
			isSaving = false;
		}
	}
</script>

<form
	id={FORM_ID}
	onsubmit={handleSubmit}
	novalidate
	class="space-y-3 border-2 border-light-three p-3 sm:p-4 dark:border-dark-three"
	aria-label={isNew ? 'Añadir color al producto' : 'Editar color del producto'}
>
	<div class="flex flex-wrap items-center justify-between gap-2">
		<h3 class="text-base font-semibold text-light-two dark:text-dark-two">
			{isNew ? 'Añadir color' : `Editar color «${color?.color.nombre}»`}
		</h3>
		<button
			type="button"
			onclick={() => (isColorOpen = true)}
			disabled={isSaving}
			class="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-light-three underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-light-three focus-visible:outline-none disabled:opacity-50 dark:text-dark-three"
		>
			<PlusIcon class="size-4" />
			Crear color
		</button>
	</div>

	{#if formError}
		<AlertBox>{formError}</AlertBox>
	{/if}
	{#if costosError}
		<p class="text-xs text-light-two_d dark:text-dark-two_d">
			No se pudo cargar el costo de las tallas guardadas, así que por ahora no se puede corregir. Lo
			demás se guarda con normalidad.
		</p>
	{/if}

	<ProductoColorCard
		bind:color={form}
		colores={todosColores}
		{usedColorIds}
		{tallas}
		path={PATH}
		{errors}
		disabled={isSaving}
	/>

	<div class="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
		{#if isUploading}
			<p class="text-center text-xs text-light-two_d sm:mr-auto sm:text-left dark:text-dark-two_d">
				Espera a que terminen de subirse las imágenes.
			</p>
		{:else if !isNew && !hasChanges}
			<p class="text-center text-xs text-light-two_d sm:mr-auto sm:text-left dark:text-dark-two_d">
				Modifica algún campo para guardar.
			</p>
		{/if}
		<Button variant="outline" onclick={onCancel} disabled={isSaving} class="w-full sm:w-auto">
			Cancelar
		</Button>
		<Button
			type="submit"
			loading={isSaving}
			disabled={isUploading || (!isNew && !hasChanges)}
			class="w-full sm:w-auto"
		>
			{isNew ? 'Añadir color' : 'Guardar color'}
		</Button>
	</div>
</form>

<!-- Fuera del <form>: el diálogo trae su propio formulario y no pueden anidarse -->
<ColorFormSheet
	isOpen={isColorOpen}
	onClose={() => (isColorOpen = false)}
	onSaved={handleColorCreated}
/>
