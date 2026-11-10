<script lang="ts">
	import { resolve } from '$app/paths';
	import type { TiendaProducto } from '#lib/interfaces/index.ts';
	import { imagenSrcset, imagenUrl, slugIdParam } from '#lib/utils/index.ts';
	import TiendaPrecio from './tiendaPrecio.svelte';

	interface Props {
		producto: TiendaProducto;
		/** Las primeras tarjetas (sobre el pliegue) se cargan sin lazy */
		prioridad?: boolean;
	}

	let { producto, prioridad = false }: Props = $props();

	// const MAX_COLORES = 4;
	const href = $derived(
		resolve('/(tienda)/[producto=producto]', { producto: slugIdParam(producto, 'p') })
	);
</script>

<article class="group flex flex-col">
	<a
		{href}
		class="flex flex-col focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-current"
	>
		<div class="relative aspect-3/4 overflow-hidden bg-light-one_d dark:bg-dark-one_d">
			{#if producto.portada_url}
				<img
					src={imagenUrl(producto.portada_url, 700)}
					srcset={imagenSrcset(producto.portada_url)}
					sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 50vw"
					alt={producto.nombre}
					loading={prioridad ? 'eager' : 'lazy'}
					fetchpriority={prioridad ? 'high' : 'auto'}
					decoding="async"
					class={[
						'h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none',
						producto.agotado && 'opacity-60'
					]}
				/>
			{/if}
			{#if producto.agotado}
				<span
					class="absolute top-3 left-3 bg-light-one px-2 py-0.5 text-editorial dark:bg-dark-one"
				>
					Agotado
				</span>
			{/if}
		</div>

		<div class="mt-3 flex flex-col items-center gap-0.5 px-1 text-center text-editorial">
			<h3 class="w-full truncate">{producto.nombre}</h3>
			<TiendaPrecio precios={producto} compacto class="justify-center" />
		</div>
	</a>

	<div class="mt-2 flex items-center justify-center gap-1.5">
		<!-- {#if producto.colores.length > 1} -->
		<span class="sr-only">{producto.colores.length} colores:</span>
		{#each producto.colores as color (color.id)}
			<span
				class="size-2.5 border border-light-two/20 dark:border-dark-two/30"
				style:background-color={color.codigo_hex ?? 'transparent'}
				title={color.nombre}
				aria-hidden="true"
			></span>
		{/each}
		<!-- {#if producto.colores.length > MAX_COLORES}
				<span class="text-editorial text-[10px]" aria-hidden="true">
					+{producto.colores.length - MAX_COLORES}
				</span>
			{/if} -->
		<!-- {:else}
			<span class="text-lg leading-none font-extralight" aria-hidden="true">+</span>
		{/if} -->
	</div>
</article>
