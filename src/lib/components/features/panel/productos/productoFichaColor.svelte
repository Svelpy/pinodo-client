<script lang="ts">
	import {
		Badge,
		ColorSwatch,
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '#lib/components/ui/index.ts';
	import { IMAGEN_TIPO_LABEL } from '#lib/constants/index.ts';
	import type { ProductoColor } from '#lib/interfaces/index.ts';
	import {
		formatBoolean,
		formatCurrency,
		formatDate,
		formatNumber,
		formatValue
	} from '#lib/utils/index.ts';

	interface Props {
		color: ProductoColor;
	}

	let { color }: Props = $props();

	const headClass = 'h-10 text-xs tracking-wide text-light-two_d uppercase dark:text-dark-two_d';
</script>

<article class="border border-light-one_d bg-light-one dark:border-dark-one_d dark:bg-dark-one">
	<header
		class="flex flex-wrap items-center gap-3 border-b border-light-one_d p-3 sm:p-4 dark:border-dark-one_d"
	>
		<ColorSwatch hex={color.color.codigo_hex} class="size-8" />
		<div class="min-w-0 flex-1">
			<h3 class="truncate font-semibold text-light-two dark:text-dark-two">{color.color.nombre}</h3>
			<p class="font-mono text-xs text-light-two_d dark:text-dark-two_d">
				{color.color.codigo_hex}
			</p>
		</div>
		<Badge variant={color.is_visible ? 'success' : 'secondary'} dot>
			{formatBoolean(color.is_visible, { trueLabel: 'Visible', falseLabel: 'Oculto' })}
		</Badge>
	</header>

	<div class="space-y-5 p-3 sm:p-4">
		<div>
			<h4 class="mb-2 text-sm font-medium text-light-two dark:text-dark-two">Imágenes</h4>
			{#if color.imagenes.length === 0}
				<p class="text-sm text-light-two_d dark:text-dark-two_d">Este color no tiene imágenes.</p>
			{:else}
				<ul class="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
					{#each color.imagenes as imagen (imagen.id)}
						<li>
							<!-- Enlace externo al archivo en el CDN, no una ruta de la app: no pasa por resolve() -->
							<!-- eslint-disable svelte/no-navigation-without-resolve -->
							<a
								href={imagen.url}
								target="_blank"
								rel="noreferrer"
								class="block aspect-square overflow-hidden bg-light-one_d focus-visible:ring-2 focus-visible:ring-light-three focus-visible:outline-none dark:bg-dark-one_d"
							>
								<img
									src={imagen.url}
									alt="{color.color.nombre} ({IMAGEN_TIPO_LABEL[imagen.tipo] ?? imagen.tipo})"
									loading="lazy"
									decoding="async"
									class="size-full object-cover"
								/>
							</a>
							<!-- eslint-enable svelte/no-navigation-without-resolve -->
							<p class="mt-1 text-xs text-light-two_d dark:text-dark-two_d">
								{IMAGEN_TIPO_LABEL[imagen.tipo] ?? imagen.tipo}
							</p>
						</li>
					{/each}
				</ul>
			{/if}
		</div>

		<div>
			<h4 class="mb-2 text-sm font-medium text-light-two dark:text-dark-two">Tallas (SKUs)</h4>
			{#if color.skus.length === 0}
				<p class="text-sm text-light-two_d dark:text-dark-two_d">Este color no tiene SKUs.</p>
			{:else}
				<div class="overflow-x-auto border border-light-one_d dark:border-dark-one_d">
					<Table class="min-w-176 text-sm">
						<TableHeader>
							<TableRow class="border-light-one_d hover:bg-transparent dark:border-dark-one_d">
								<TableHead class={headClass}>Talla</TableHead>
								<TableHead class={headClass}>Código de barras</TableHead>
								<TableHead class={headClass}>Precio</TableHead>
								<TableHead class={headClass}>Vigente</TableHead>
								<TableHead class={headClass}>Stock</TableHead>
								<TableHead class={headClass}>Visibilidad</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{#each color.skus as sku (sku.id)}
								{@const bajo = sku.stock.cantidad <= sku.stock.minimo}
								<TableRow class="border-light-one_d dark:border-dark-one_d">
									<TableCell class="px-3 py-2 font-medium">{sku.talla.etiqueta}</TableCell>
									<TableCell class="px-3 py-2 font-mono text-xs">
										{formatValue(sku.codigo_barras)}
									</TableCell>
									<TableCell class="px-3 py-2 whitespace-nowrap">
										{formatCurrency(sku.precio.normal)}
										{#if sku.precio.rebajado !== null}
											<span class="block text-xs text-light-two_d dark:text-dark-two_d">
												Rebajado: {formatCurrency(sku.precio.rebajado)}
												{#if sku.precio.rebaja_hasta}
													· hasta {formatDate(sku.precio.rebaja_hasta)}
												{/if}
											</span>
										{/if}
									</TableCell>
									<TableCell class="px-3 py-2 font-medium whitespace-nowrap">
										{formatCurrency(sku.precio_vigente)}
									</TableCell>
									<TableCell class="px-3 py-2 whitespace-nowrap">
										{formatNumber(sku.stock.cantidad)}
										<span class="text-xs text-light-two_d dark:text-dark-two_d">
											(mín. {formatNumber(sku.stock.minimo)})
										</span>
										{#if bajo}
											<Badge variant="warning" size="sm" class="ml-1">
												{sku.stock.cantidad === 0 ? 'Agotado' : 'Bajo'}
											</Badge>
										{/if}
									</TableCell>
									<TableCell class="px-3 py-2">
										<Badge variant={sku.is_visible ? 'success' : 'secondary'} size="sm">
											{formatBoolean(sku.is_visible, {
												trueLabel: 'Visible',
												falseLabel: 'Oculto'
											})}
										</Badge>
									</TableCell>
								</TableRow>
							{/each}
						</TableBody>
					</Table>
				</div>
			{/if}
		</div>
	</div>
</article>
