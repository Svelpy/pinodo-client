<script lang="ts">
	import { Input, Select } from '#lib/components/ui/index.ts';
	import { TrashIcon } from '#lib/icons/outline/index.ts';
	import type { ProductoFormSku, Talla } from '#lib/interfaces/index.ts';
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
		disabled?: boolean;
		onRemove: () => void;
	}

	let {
		sku = $bindable(),
		position,
		tallas,
		path,
		errors,
		disabled = false,
		onRemove
	}: Props = $props();

	const id = $props.id();
	const err = (field: string) => errors[`${path}.${field}`];
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
			error={err('codigo_barras')}
			aria-invalid={!!err('codigo_barras')}
			maxlength={PRODUCTO_LIMITS.CODIGO_BARRAS_MAX}
			inputmode="numeric"
			autocomplete="off"
		/>

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
	</fieldset>
</div>
