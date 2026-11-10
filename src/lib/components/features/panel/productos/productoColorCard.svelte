<script lang="ts">
	import { Button, ColorSwatch, Select } from '#lib/components/ui/index.ts';
	import { PlusIcon, TrashIcon } from '#lib/icons/outline/index.ts';
	import type { Color, ProductoFormColor, Talla } from '#lib/interfaces/index.ts';
	import { createProductoSku } from '#lib/utils/index.ts';
	import ProductoImagenesField from './productoImagenesField.svelte';
	import ProductoSkuRow from './productoSkuRow.svelte';

	interface Props {
		color: ProductoFormColor;
		/** 1, 2, 3… para la etiqueta; sin valor, solo «Color» (p. ej. al editar un color suelto) */
		position?: number;
		/** Catálogo de colores y los que ya usan las otras tarjetas (no se repiten) */
		colores: readonly Color[];
		usedColorIds: readonly string[];
		tallas: readonly Talla[];
		/** Ruta del color en el formulario (`colores.0`), para buscar sus errores */
		path: string;
		errors: Record<string, string>;
		/** Códigos de barras de todo el formulario (al crear un producto, de todos sus colores) */
		usedBarcodes?: readonly string[];
		disabled?: boolean;
		/** Sin handler no se muestra «Quitar color» (al editar, eliminar es una acción aparte) */
		onRemove?: () => void;
	}

	let {
		color = $bindable(),
		position,
		colores,
		usedColorIds,
		tallas,
		path,
		errors,
		usedBarcodes,
		disabled = false,
		onRemove
	}: Props = $props();

	const id = $props.id();

	const selected = $derived(colores.find((item) => item.id === color.color_id));
	const usedTallaIds = $derived(color.skus.map((sku) => sku.talla_id).filter(Boolean));
	// Sin lista del formulario completo, al menos no se repiten dentro de este color
	const barcodes = $derived(usedBarcodes ?? color.skus.map((sku) => sku.codigo_barras.trim()));
	// Cuando ya hay un SKU por cada talla no se puede agregar otro
	const canAddSku = $derived(tallas.length > color.skus.length);

	function removeSku(key: string) {
		color.skus = color.skus.filter((sku) => sku.key !== key);
	}
</script>

<div class="border border-light-one_d bg-light-one dark:border-dark-one_d dark:bg-dark-one">
	<div
		class="flex flex-wrap items-end gap-3 border-b border-light-one_d p-3 sm:p-4 dark:border-dark-one_d"
	>
		<div class="flex min-w-0 flex-1 items-end gap-3 sm:min-w-64">
			<ColorSwatch hex={selected?.codigo_hex ?? '#FFFFFF'} class="mb-1.5 size-8" />
			<Select
				id="{id}-color"
				label={position ? `Color ${position}` : 'Color'}
				class="min-w-0 flex-1"
				bind:value={color.color_id}
				error={errors[`${path}.color_id`]}
				aria-invalid={!!errors[`${path}.color_id`]}
				{disabled}
				required
			>
				<option value="" disabled>Selecciona un color</option>
				{#each colores as item (item.id)}
					<option
						value={item.id}
						disabled={item.id !== color.color_id && usedColorIds.includes(item.id)}
					>
						{item.nombre} ({item.codigo_hex})
					</option>
				{/each}
			</Select>
		</div>

		<Select
			id="{id}-visible"
			label="Visibilidad"
			class="w-full sm:w-40"
			value={color.is_visible ? 'true' : 'false'}
			onchange={(event) => (color.is_visible = event.currentTarget.value === 'true')}
			{disabled}
		>
			<option value="true">Visible</option>
			<option value="false">Oculto</option>
		</Select>

		{#if onRemove}
			<Button variant="outline" onclick={onRemove} {disabled} class="w-full sm:w-auto">
				{#snippet leftIcon()}<TrashIcon class="size-4" />{/snippet}
				Quitar color
			</Button>
		{/if}
	</div>

	<div class="space-y-5 p-3 sm:p-4">
		<div>
			<p class="mb-2 text-sm font-medium text-light-two dark:text-dark-two">Imágenes</p>
			<ProductoImagenesField
				id="{id}-imagenes"
				bind:imagenes={color.imagenes}
				{disabled}
				error={errors[`${path}.imagenes`]}
			/>
		</div>

		<div class="space-y-3">
			<p class="text-sm font-medium text-light-two dark:text-dark-two">Tallas (SKUs)</p>

			{#if tallas.length === 0}
				<p class="text-sm text-light-two_d dark:text-dark-two_d">
					Aún no hay tallas registradas: créalas primero en la página Tallas.
				</p>
			{:else if color.skus.length === 0}
				<p class="text-sm text-light-two_d dark:text-dark-two_d">
					Agrega al menos una talla con su precio y stock para poder vender este color.
				</p>
			{/if}

			{#each color.skus as sku, index (sku.key)}
				<ProductoSkuRow
					bind:sku={color.skus[index]}
					position={index + 1}
					tallas={tallas.filter(
						(talla) => talla.id === sku.talla_id || !usedTallaIds.includes(talla.id)
					)}
					path="{path}.skus.{index}"
					{errors}
					usedBarcodes={barcodes}
					{disabled}
					onRemove={() => removeSku(sku.key)}
				/>
			{/each}

			<Button
				variant="outline"
				size="sm"
				onclick={() => color.skus.push(createProductoSku())}
				disabled={disabled || !canAddSku}
				class="w-full sm:w-auto"
			>
				{#snippet leftIcon()}<PlusIcon class="size-4" />{/snippet}
				Agregar talla
			</Button>
		</div>
	</div>
</div>
