<script lang="ts">
	import { Badge } from '#lib/components/ui/index.ts';
	import type { ProductoDetalle } from '#lib/interfaces/index.ts';
	import {
		formatBoolean,
		formatDate,
		formatNumber,
		formatPriceRange,
		formatValue
	} from '#lib/utils/index.ts';
	import ProductoColores from './productoColores.svelte';
	import ProductoFichaColor from './productoFichaColor.svelte';
	import ProductoPortada from './productoPortada.svelte';

	interface Props {
		producto: ProductoDetalle;
	}

	let { producto }: Props = $props();

	const BASE =
		'border border-light-one_d bg-light-one p-4 sm:p-6 dark:border-dark-one_d dark:bg-dark-one';
	const LABEL = 'text-xs tracking-wide text-light-two_d uppercase dark:text-dark-two_d';

	const details = $derived([
		{ label: 'Descripción', value: producto.descripcion },
		{ label: 'Cuidados', value: producto.cuidados },
		{ label: 'Composición', value: producto.composicion }
	]);
</script>

<div class="space-y-4">
	<section class={BASE} aria-labelledby="ficha-resumen">
		<div class="flex flex-col gap-4 sm:flex-row">
			<ProductoPortada
				url={producto.resumen.portada_url}
				alt="Portada de {producto.nombre}"
				class="size-28 self-start sm:size-36"
			/>
			<div class="min-w-0 flex-1 space-y-3">
				<div>
					<h2
						id="ficha-resumen"
						class="text-lg font-semibold text-light-two sm:text-xl dark:text-dark-two"
					>
						{producto.nombre}
					</h2>
					<p class="text-sm text-light-two_d dark:text-dark-two_d">{producto.seccion.nombre}</p>
				</div>

				<dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
					<div>
						<dt class={LABEL}>Visibilidad</dt>
						<dd class="mt-1">
							<Badge variant={producto.is_visible ? 'success' : 'secondary'} dot>
								{formatBoolean(producto.is_visible, { trueLabel: 'Visible', falseLabel: 'Oculto' })}
							</Badge>
						</dd>
					</div>
					<div>
						<dt class={LABEL}>Precio</dt>
						<dd class="mt-1 text-light-two dark:text-dark-two">
							{formatPriceRange(producto.resumen.precio_desde, producto.resumen.precio_hasta)}
						</dd>
					</div>
					<div>
						<dt class={LABEL}>Stock total</dt>
						<dd class="mt-1 text-light-two dark:text-dark-two">
							{formatNumber(producto.resumen.stock_total)}
						</dd>
					</div>
					<div>
						<dt class={LABEL}>Colores</dt>
						<dd class="mt-1">
							<ProductoColores colores={producto.resumen.colores} />
						</dd>
					</div>
				</dl>

				<p class="text-xs text-light-two_d dark:text-dark-two_d">
					Creado el {formatDate(producto.created_at)} · Actualizado el {formatDate(
						producto.updated_at
					)}
				</p>
			</div>
		</div>
	</section>

	<section class={BASE} aria-labelledby="ficha-detalles">
		<h2 id="ficha-detalles" class="mb-4 text-base font-semibold text-light-two dark:text-dark-two">
			Detalles
		</h2>
		<dl class="space-y-4 text-sm">
			{#each details as detail (detail.label)}
				<div>
					<dt class={LABEL}>{detail.label}</dt>
					<dd class="mt-1 whitespace-pre-line text-light-two dark:text-dark-two">
						{formatValue(detail.value)}
					</dd>
				</div>
			{/each}
			<div>
				<dt class={LABEL}>Categorías</dt>
				<dd class="mt-1">
					{#if producto.categorias.length === 0}
						<span class="text-light-two_d dark:text-dark-two_d">Sin categorías</span>
					{:else}
						<ul class="flex flex-wrap gap-2">
							{#each producto.categorias as categoria (categoria.id)}
								<li><Badge variant="secondary">{categoria.nombre}</Badge></li>
							{/each}
						</ul>
					{/if}
				</dd>
			</div>
		</dl>
	</section>

	<section aria-labelledby="ficha-colores" class="space-y-3">
		<h2 id="ficha-colores" class="text-base font-semibold text-light-two dark:text-dark-two">
			Colores y tallas
		</h2>
		{#if producto.colores.length === 0}
			<p
				class="border border-light-one_d bg-light-one p-4 text-sm text-light-two_d dark:border-dark-one_d dark:bg-dark-one dark:text-dark-two_d"
			>
				Este producto no tiene colores.
			</p>
		{:else}
			{#each producto.colores as color (color.id)}
				<ProductoFichaColor {color} />
			{/each}
		{/if}
	</section>
</div>
