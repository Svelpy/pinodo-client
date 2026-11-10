<script module lang="ts">
	/** id de la opción de un SKU (el input lo usa en aria-activedescendant) */
	export function sugerenciaOptionId(listboxId: string, skuId: string): string {
		return `${listboxId}-${skuId}`;
	}
</script>

<script lang="ts">
	import { Button, ColorSwatch } from '#lib/components/ui/index.ts';
	import { RefreshIcon } from '#lib/icons/outline/index.ts';
	import type { SkuInventario } from '#lib/interfaces/index.ts';
	import { agruparInventario, estadoStockSku, formatCurrency } from '#lib/utils/index.ts';

	interface Props {
		/** id del listbox (el input lo referencia con aria-controls) */
		id: string;
		skus: SkuInventario[];
		/** Unidades de cada SKU que ya están en el carrito */
		enCarrito: ReadonlyMap<string, number>;
		/** SKU resaltado con el teclado */
		activoId: string | null;
		isLoading?: boolean;
		error?: string;
		/** Mensaje cuando no hay resultados (o aún no se busca) */
		mensaje?: string;
		hasMore?: boolean;
		disabled?: boolean;
		onElegir: (sku: SkuInventario) => void;
		onActivar: (skuId: string) => void;
		onLoadMore?: () => void;
		onRetry?: () => void;
	}

	let {
		id,
		skus,
		enCarrito,
		activoId,
		isLoading = false,
		error = '',
		mensaje = '',
		hasMore = false,
		disabled = false,
		onElegir,
		onActivar,
		onLoadMore,
		onRetry
	}: Props = $props();

	const productos = $derived(agruparInventario(skus));
	let lista = $state<HTMLUListElement>();

	// La opción resaltada con el teclado siempre queda a la vista
	$effect(() => {
		if (!activoId) return;
		lista
			?.querySelector(`#${CSS.escape(sugerenciaOptionId(id, activoId))}`)
			?.scrollIntoView({ block: 'nearest' });
	});
</script>

<!-- mousedown sin foco: el input conserva el foco y el teclado sigue funcionando al hacer clic -->
<div
	class="absolute inset-x-0 top-full z-30 mt-1 border border-light-four bg-light-one shadow-lg dark:border-dark-four_d dark:bg-dark-one"
	onmousedown={(event) => event.preventDefault()}
	role="presentation"
>
	{#if error && skus.length === 0}
		<div role="alert" class="flex items-center justify-between gap-3 px-3 py-3 text-sm">
			<span class="text-light-error dark:text-dark-error">{error}</span>
			{#if onRetry}
				<Button variant="outline" size="sm" onclick={onRetry}>
					{#snippet leftIcon()}<RefreshIcon class="size-4" />{/snippet}
					Reintentar
				</Button>
			{/if}
		</div>
	{:else if isLoading && skus.length === 0}
		<div role="status" aria-label="Buscando productos" class="space-y-2 p-3">
			<span class="sr-only">Buscando…</span>
			{#each { length: 4 }, i (i)}
				<div class="h-9 animate-pulse bg-light-one_d dark:bg-dark-one_d" aria-hidden="true"></div>
			{/each}
		</div>
	{:else if skus.length === 0}
		<p role="status" class="px-3 py-4 text-sm text-light-two_d dark:text-dark-two_d">{mensaje}</p>
	{/if}

	<ul
		bind:this={lista}
		{id}
		role="listbox"
		aria-label="Productos encontrados"
		class={[
			'max-h-[min(24rem,55dvh)] overflow-y-auto overscroll-contain transition-opacity',
			skus.length === 0 && 'hidden',
			isLoading && 'opacity-60'
		]}
	>
		{#each productos as producto (producto.producto_id)}
			<li role="presentation">
				<p
					class="sticky top-0 z-10 truncate border-b border-light-one_d bg-light-one_d px-3 py-1.5 text-xs font-semibold tracking-wide text-light-two uppercase dark:border-dark-one_d dark:bg-dark-one_d dark:text-dark-two"
					aria-hidden="true"
				>
					{producto.producto_nombre}
				</p>
				<ul role="group" aria-label={producto.producto_nombre}>
					{#each producto.colores as color (color.color_id)}
						{#each color.skus as sku (sku.id)}
							{@const cantidad = enCarrito.get(sku.id) ?? 0}
							{@const stock = estadoStockSku(sku, cantidad)}
							{@const bloqueado = disabled || stock.agotado}
							{@const activo = sku.id === activoId}
							{@const rebaja = sku.precio_vigente < sku.precio.normal}
							<!-- Las opciones no reciben foco: el teclado se maneja desde el input (patrón combobox) -->
							<!-- svelte-ignore a11y_click_events_have_key_events -->
							<li
								id={sugerenciaOptionId(id, sku.id)}
								role="option"
								aria-selected={activo}
								aria-disabled={bloqueado}
								aria-label="{producto.producto_nombre}, {color.color_nombre}, talla {sku.talla_etiqueta}, {formatCurrency(
									sku.precio_vigente
								)}, {stock.texto}{cantidad ? `, ${cantidad} en el carrito` : ''}"
								onclick={() => !bloqueado && onElegir(sku)}
								onmousemove={() => !activo && onActivar(sku.id)}
								class={[
									'grid min-h-11 cursor-pointer grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 px-3 py-1.5 text-sm',
									activo && 'bg-light-three/10 dark:bg-dark-three/15',
									bloqueado && 'cursor-not-allowed opacity-45'
								]}
							>
								<span class="flex min-w-0 items-center gap-2">
									<ColorSwatch hex={color.color_codigo_hex} class="size-4" />
									<span class="truncate text-light-two_d dark:text-dark-two_d">
										{color.color_nombre}
									</span>
									<span class="shrink-0 font-semibold text-light-two dark:text-dark-two">
										{sku.talla_etiqueta}
									</span>
									{#if cantidad > 0}
										<span
											class="shrink-0 bg-light-three px-1.5 text-[0.6875rem] font-semibold text-light-one dark:bg-dark-three dark:text-dark-one"
											aria-hidden="true"
										>
											{cantidad} en carrito
										</span>
									{/if}
								</span>
								<span class="text-right tabular-nums">
									<span
										class={[
											'font-medium',
											rebaja
												? 'text-light-accent dark:text-dark-accent'
												: 'text-light-two dark:text-dark-two'
										]}
									>
										{formatCurrency(sku.precio_vigente)}
									</span>
									{#if rebaja}
										<span class="ml-1 text-xs text-light-two_d line-through dark:text-dark-two_d">
											{formatCurrency(sku.precio.normal)}
										</span>
									{/if}
								</span>
								<span
									class={[
										'w-24 text-right text-xs',
										stock.bajo
											? 'font-medium text-[color-mix(in_oklab,var(--color-light-warning)_60%,black)] dark:text-dark-warning'
											: 'text-light-two_d dark:text-dark-two_d'
									]}
								>
									{stock.texto}
								</span>
							</li>
						{/each}
					{/each}
				</ul>
			</li>
		{/each}
	</ul>

	{#if skus.length > 0 && (hasMore || error)}
		<div
			class="flex items-center justify-between gap-3 border-t border-light-one_d px-3 py-2 dark:border-dark-one_d"
		>
			{#if error}
				<p role="alert" class="text-sm text-light-error dark:text-dark-error">{error}</p>
			{/if}
			{#if hasMore && onLoadMore}
				<Button variant="ghost" size="sm" loading={isLoading} onclick={onLoadMore} class="ml-auto">
					Cargar más
				</Button>
			{/if}
		</div>
	{/if}
</div>
