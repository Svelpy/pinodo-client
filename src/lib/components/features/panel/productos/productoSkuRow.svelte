<script lang="ts">
	import { Input, Select } from '#lib/components/ui/index.ts';
	import { LoaderIcon, SparklesIcon, TrashIcon } from '#lib/icons/outline/index.ts';
	import type { ProductoFormSku, Talla } from '#lib/interfaces/index.ts';
	import { errorService, skuService } from '#lib/services/index.ts';
	import { firstFreeEan13 } from '#lib/utils/index.ts';
	import { PRODUCTO_LIMITS } from '#lib/zod/index.ts';

	interface Props {
		sku: ProductoFormSku;
		/** 1, 2, 3… para el título de la fila */
		position: number;
		/** Tallas que se pueden elegir aquí: la propia y las que no usa otro SKU del mismo color */
		tallas: readonly Talla[];
		/** Ruta del SKU en el formulario (`colores.0.skus.1`), para buscar sus errores */
		path: string;
		errors: Record<string, string>;
		/** Códigos de barras de las demás filas del formulario: la sugerencia no los repite */
		usedBarcodes?: readonly string[];
		disabled?: boolean;
		onRemove: () => void;
	}

	let {
		sku = $bindable(),
		position,
		tallas,
		path,
		errors,
		usedBarcodes = [],
		disabled = false,
		onRemove
	}: Props = $props();

	const id = $props.id();
	const err = (field: string) => errors[`${path}.${field}`];

	let isSuggesting = $state(false);
	let suggestError = $state('');

	// La API devuelve un EAN-13 libre pero no lo reserva: dos filas sin guardar recibirían el mismo,
	// así que se salta a uno siguiente si ya está en otra fila del formulario
	async function suggestBarcode() {
		isSuggesting = true;
		suggestError = '';
		try {
			const { codigo_barras } = await skuService.sugerirCodigoBarras();
			const others = new Set(usedBarcodes.filter((code) => code && code !== sku.codigo_barras));
			sku.codigo_barras = firstFreeEan13(codigo_barras, others);
		} catch (error) {
			suggestError = errorService.getMessage(error);
		} finally {
			isSuggesting = false;
		}
	}
</script>

<div class="space-y-3 border border-light-one_d p-3 sm:p-4 dark:border-dark-one_d">
	<div class="flex items-center justify-between gap-2">
		<p class="text-sm font-semibold text-light-two dark:text-dark-two">SKU {position}</p>
		<button
			type="button"
			onclick={onRemove}
			{disabled}
			aria-label="Quitar SKU {position}"
			class="inline-flex size-9 items-center justify-center text-light-two_d transition-colors hover:bg-light-one_d hover:text-light-two focus-visible:ring-2 focus-visible:ring-light-three focus-visible:outline-none dark:text-dark-two_d dark:hover:bg-dark-one_d dark:hover:text-dark-two"
		>
			<TrashIcon class="size-5" />
		</button>
	</div>

	<fieldset class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" {disabled}>
		<Select
			id="{id}-talla"
			label="Talla"
			bind:value={sku.talla_id}
			error={err('talla_id')}
			aria-invalid={!!err('talla_id')}
			required
		>
			<option value="" disabled>Selecciona una talla</option>
			{#each tallas as talla (talla.id)}
				<option value={talla.id}>{talla.etiqueta}</option>
			{/each}
		</Select>

		<Input
			id="{id}-barras"
			label="Código de barras (opcional)"
			bind:value={sku.codigo_barras}
			error={err('codigo_barras') || suggestError}
			aria-invalid={!!err('codigo_barras')}
			maxlength={PRODUCTO_LIMITS.CODIGO_BARRAS_MAX}
			inputmode="numeric"
			autocomplete="off"
		>
			{#snippet trailing()}
				<button
					type="button"
					onclick={suggestBarcode}
					disabled={disabled || isSuggesting}
					aria-label="Sugerir un código de barras"
					title="Sugerir código de barras"
					class="inline-flex size-9 items-center justify-center text-light-two_d transition-colors hover:bg-light-one_d hover:text-light-three focus-visible:ring-2 focus-visible:ring-light-three focus-visible:outline-none disabled:opacity-50 dark:text-dark-two_d dark:hover:bg-dark-one_d dark:hover:text-dark-three"
				>
					{#if isSuggesting}
						<LoaderIcon class="size-5 animate-spin" />
					{:else}
						<SparklesIcon class="size-5" />
					{/if}
				</button>
			{/snippet}
		</Input>

		<Select
			id="{id}-visible"
			label="Visibilidad"
			value={sku.is_visible ? 'true' : 'false'}
			onchange={(event) => (sku.is_visible = event.currentTarget.value === 'true')}
		>
			<option value="true">Visible</option>
			<option value="false">Oculto</option>
		</Select>

		<Input
			id="{id}-normal"
			label="Precio normal"
			bind:value={sku.precio.normal}
			error={err('precio.normal')}
			aria-invalid={!!err('precio.normal')}
			inputmode="decimal"
			autocomplete="off"
			placeholder="0,00"
			required
		/>
		<Input
			id="{id}-rebajado"
			label="Precio rebajado (opcional)"
			bind:value={sku.precio.rebajado}
			error={err('precio.rebajado')}
			aria-invalid={!!err('precio.rebajado')}
			inputmode="decimal"
			autocomplete="off"
			placeholder="0,00"
		/>
		<Input
			id="{id}-hasta"
			type="date"
			label="Rebaja hasta (opcional)"
			bind:value={sku.precio.rebaja_hasta}
			error={err('precio.rebaja_hasta')}
			aria-invalid={!!err('precio.rebaja_hasta')}
		/>

		{#if sku.id}
			<!-- SKU ya guardado: la API no acepta su stock junto al color, se ajusta aparte -->
			<p class="text-sm text-light-two_d sm:col-span-2 lg:col-span-3 dark:text-dark-two_d">
				Stock actual: <span class="font-medium text-light-two dark:text-dark-two">
					{sku.stock.cantidad}
				</span>
				(mín. {sku.stock.minimo}). Se ajusta desde la ficha con «Ajustar stock».
			</p>
		{:else}
			<Input
				id="{id}-cantidad"
				label="Stock"
				bind:value={sku.stock.cantidad}
				error={err('stock.cantidad')}
				aria-invalid={!!err('stock.cantidad')}
				inputmode="numeric"
				autocomplete="off"
				required
			/>
			<Input
				id="{id}-minimo"
				label="Stock mínimo"
				bind:value={sku.stock.minimo}
				error={err('stock.minimo')}
				aria-invalid={!!err('stock.minimo')}
				inputmode="numeric"
				autocomplete="off"
				required
			/>
		{/if}
	</fieldset>
</div>
