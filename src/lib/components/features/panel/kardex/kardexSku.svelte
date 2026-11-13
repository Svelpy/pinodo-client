<script lang="ts">
	import type { SkuNombre } from '#lib/interfaces/index.ts';
	import { varianteSku } from '#lib/utils/index.ts';

	/** Producto, color y talla de un SKU */
	interface Props {
		sku: SkuNombre;
		/** Muestra el código de barras junto a la variante */
		mostrarCodigo?: boolean;
		class?: string;
	}

	let { sku, mostrarCodigo = false, class: className }: Props = $props();
</script>

<div class={['min-w-0', className]}>
	<p class="truncate font-medium text-light-two dark:text-dark-two" title={sku.producto_nombre}>
		{sku.producto_nombre}
	</p>
	<p class="truncate text-xs text-light-two_d dark:text-dark-two_d">
		{varianteSku(sku)}{mostrarCodigo && sku.codigo_barras ? ` · ${sku.codigo_barras}` : ''}
	</p>
</div>
