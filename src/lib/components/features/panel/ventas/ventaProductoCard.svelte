<script lang="ts">
	import { ColorSwatch } from '#lib/components/ui/index.ts';
	import type { SkuInventario } from '#lib/interfaces/index.ts';
	import { formatCurrency, type InventarioProducto } from '#lib/utils/index.ts';

	interface Props {
		producto: InventarioProducto;
		/** Unidades de cada SKU que ya están en el carrito */
		enCarrito: ReadonlyMap<string, number>;
		onAdd: (sku: SkuInventario) => void;
		disabled?: boolean;
	}

	let { producto, enCarrito, onAdd, disabled = false }: Props = $props();

	const enRebaja = (sku: SkuInventario) => sku.precio_vigente < sku.precio.normal;

	function estadoStock(sku: SkuInventario) {
		const cantidad = sku.stock.cantidad;
		const usadas = enCarrito.get(sku.id) ?? 0;
		if (cantidad <= 0) return { texto: 'Agotado', agotado: true, bajo: false };
		if (usadas >= cantidad) return { texto: 'Todo en carrito', agotado: true, bajo: false };
		const restantes = cantidad - usadas;
		return {
			texto: `${restantes} disp.`,
			agotado: false,
			bajo: cantidad <= sku.stock.minimo
		};
	}
</script>

<article
	class="border border-light-one_d bg-light-one dark:border-dark-one_d dark:bg-dark-one"
	aria-label={producto.producto_nombre}
>
	<h3
		class="truncate border-b border-light-one_d px-3 py-2.5 font-semibold text-light-two dark:border-dark-one_d dark:text-dark-two"
		title={producto.producto_nombre}
	>
		{producto.producto_nombre}
	</h3>

	<div class="divide-y divide-light-one_d dark:divide-dark-one_d">
		{#each producto.colores as color (color.color_id)}
			<div class="px-3 py-2.5">
				<p class="mb-2 flex items-center gap-2 text-sm text-light-two_d dark:text-dark-two_d">
					<ColorSwatch hex={color.color_codigo_hex} class="size-4" />
					<span class="truncate">{color.color_nombre}</span>
				</p>
				<ul class="grid grid-cols-[repeat(auto-fill,minmax(5.25rem,1fr))] gap-1.5">
					{#each color.skus as sku (sku.id)}
						{@const stock = estadoStock(sku)}
						{@const cantidad = enCarrito.get(sku.id) ?? 0}
						{@const rebaja = enRebaja(sku)}
						<li>
							<button
								type="button"
								disabled={disabled || stock.agotado}
								onclick={() => onAdd(sku)}
								aria-label="Agregar {producto.producto_nombre}, {color.color_nombre}, talla {sku.talla_etiqueta}, {formatCurrency(
									sku.precio_vigente
								)}, {stock.texto}{cantidad ? `, ${cantidad} en el carrito` : ''}"
								class={[
									'relative flex w-full flex-col items-start gap-0.5 border px-2 py-1.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-light-three focus-visible:outline-none active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100 dark:focus-visible:ring-dark-three',
									cantidad > 0
										? 'border-light-three bg-light-three/5 dark:border-dark-three dark:bg-dark-three/10'
										: 'border-light-one_d hover:border-light-three dark:border-dark-one_d dark:hover:border-dark-three'
								]}
							>
								<span
									class="text-base leading-tight font-semibold text-light-two dark:text-dark-two"
								>
									{sku.talla_etiqueta}
								</span>
								<span
									class={[
										'text-xs font-medium',
										rebaja
											? 'text-light-accent dark:text-dark-accent'
											: 'text-light-two dark:text-dark-two'
									]}
								>
									{formatCurrency(sku.precio_vigente)}
								</span>
								{#if rebaja}
									<span class="text-[0.6875rem] text-light-two_d line-through dark:text-dark-two_d">
										{formatCurrency(sku.precio.normal)}
									</span>
								{/if}
								<span
									class={[
										'text-[0.6875rem]',
										stock.bajo
											? 'font-medium text-[color-mix(in_oklab,var(--color-light-warning)_60%,black)] dark:text-dark-warning'
											: 'text-light-two_d dark:text-dark-two_d'
									]}
								>
									{stock.texto}
								</span>
								{#if cantidad > 0}
									<span
										class="absolute top-1 right-1 inline-flex min-w-5 items-center justify-center bg-light-three px-1 text-[0.6875rem] font-semibold text-light-one dark:bg-dark-three dark:text-dark-one"
										aria-hidden="true"
									>
										{cantidad}
									</span>
								{/if}
							</button>
						</li>
					{/each}
				</ul>
			</div>
		{/each}
	</div>
</article>
