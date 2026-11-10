<script lang="ts">
	import { ScanBarcodeIcon, ShoppingCartIcon, TrashIcon } from '#lib/icons/outline/index.ts';
	import type { CarritoLinea } from '#lib/interfaces/index.ts';
	import VentaCarritoLinea from './ventaCarritoLinea.svelte';

	interface Props {
		lineas: CarritoLinea[];
		/** nueva = registrar; edicion = pedido guardado */
		modo?: 'nueva' | 'edicion';
		/** Edición: cobrar con los precios de hoy */
		recalcular?: boolean;
		/** Línea recién agregada, para resaltarla */
		resaltada?: string | null;
		disabled?: boolean;
		onCantidadChange: (skuId: string, cantidad: number) => void;
		onDescuentoChange: (skuId: string, descuento: string) => void;
		onRemove: (skuId: string) => void;
		onVaciar?: () => void;
	}

	let {
		lineas,
		modo = 'nueva',
		recalcular = false,
		resaltada = null,
		disabled = false,
		onCantidadChange,
		onDescuentoChange,
		onRemove,
		onVaciar
	}: Props = $props();

	const id = $props.id();
	const unidades = $derived(lineas.reduce((total, linea) => total + linea.cantidad, 0));
	const vacio = $derived(lineas.length === 0);
</script>

<section
	aria-labelledby="{id}-titulo"
	class="border border-light-one_d bg-light-one dark:border-dark-one_d dark:bg-dark-one"
>
	<header
		class="flex items-center justify-between gap-2 border-b border-light-one_d px-3 py-2.5 sm:px-4 dark:border-dark-one_d"
	>
		<h2
			id="{id}-titulo"
			class="flex items-center gap-2 font-semibold text-light-two dark:text-dark-two"
		>
			<ShoppingCartIcon class="size-5" />
			{modo === 'edicion' ? 'Pedido' : 'Carrito'}
			{#if unidades > 0}
				<span class="text-sm font-normal text-light-two_d dark:text-dark-two_d">
					({unidades}
					{unidades === 1 ? 'prenda' : 'prendas'})
				</span>
			{/if}
		</h2>
		{#if onVaciar && !vacio}
			<button
				type="button"
				onclick={onVaciar}
				{disabled}
				class="inline-flex h-9 items-center gap-1 px-2 text-sm text-light-two_d transition-colors hover:text-light-error disabled:opacity-40 dark:text-dark-two_d dark:hover:text-dark-error"
			>
				<TrashIcon class="size-4" />
				Vaciar
			</button>
		{/if}
	</header>

	{#if vacio}
		<div class="flex flex-col items-center px-6 py-12 text-center">
			<span
				class="flex size-12 items-center justify-center bg-light-one_d text-light-two_d dark:bg-dark-one_d dark:text-dark-two_d"
			>
				<ScanBarcodeIcon class="size-6" />
			</span>
			<p class="mt-3 font-medium text-light-two dark:text-dark-two">El carrito está vacío</p>
			<p class="mt-1 max-w-xs text-sm text-light-two_d dark:text-dark-two_d">
				Escanea una etiqueta o busca un producto por su nombre y elige la variante.
			</p>
		</div>
	{:else}
		<ul class="divide-y divide-light-one_d dark:divide-dark-one_d" aria-label="Prendas">
			{#each lineas as linea (linea.sku_id)}
				<VentaCarritoLinea
					{linea}
					{recalcular}
					resaltada={resaltada === linea.sku_id}
					{disabled}
					onCantidadChange={(cantidad) => onCantidadChange(linea.sku_id, cantidad)}
					onDescuentoChange={(descuento) => onDescuentoChange(linea.sku_id, descuento)}
					onRemove={() => onRemove(linea.sku_id)}
				/>
			{/each}
		</ul>
	{/if}
</section>
