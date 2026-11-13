<script lang="ts">
	import { ColorSwatch } from '#lib/components/ui/index.ts';
	import type { SkuNombre } from '#lib/interfaces/index.ts';
	import { varianteSku } from '#lib/utils/index.ts';

	/** Producto, color y talla de un SKU; sin nombre (SKU fuera del catálogo) muestra su código */
	interface Props {
		sku: SkuNombre | null | undefined;
		/** Código de barras del movimiento, por si el SKU ya no está en el catálogo */
		codigoBarras?: string | null;
		/** Muestra el código de barras debajo */
		mostrarCodigo?: boolean;
		class?: string;
	}

	let { sku, codigoBarras = null, mostrarCodigo = false, class: className }: Props = $props();

	const codigo = $derived(sku?.codigo_barras ?? codigoBarras);
</script>

<div class={['flex min-w-0 items-center gap-2.5', className]}>
	{#if sku?.color_codigo_hex}
		<ColorSwatch hex={sku.color_codigo_hex} class="size-6" />
	{/if}
	<div class="min-w-0">
		{#if sku}
			<p class="truncate font-medium text-light-two dark:text-dark-two" title={sku.producto_nombre}>
				{sku.producto_nombre}
			</p>
			<p class="truncate text-xs text-light-two_d dark:text-dark-two_d">
				{varianteSku(sku)}{mostrarCodigo && codigo ? ` · ${codigo}` : ''}
			</p>
		{:else}
			<p class="truncate font-medium text-light-two_d italic dark:text-dark-two_d">
				SKU fuera del catálogo
			</p>
			{#if codigo}
				<p class="truncate text-xs text-light-two_d tabular-nums dark:text-dark-two_d">{codigo}</p>
			{/if}
		{/if}
	</div>
</div>
