<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { TiendaProductoDetalle, TiendaSeo } from '#lib/components/features/tienda/index.ts';
	import { slugIdParam } from '#lib/utils/index.ts';

	let { data } = $props();

	const producto = $derived(data.producto);
	const canonicalPath = $derived(
		resolve('/(tienda)/[producto=producto]', { producto: slugIdParam(producto, 'p') })
	);
	const portada = $derived(
		producto.colores.find((c) => c.imagenes.length > 0)?.imagenes[0]?.url ?? null
	);

	const migas = $derived([
		{
			label: producto.seccion.nombre,
			href: resolve('/(tienda)/[seccion=seccion]', { seccion: producto.seccion.slug })
		},
		...producto.categorias.slice(0, 1).map((c) => ({
			label: c.nombre,
			href: resolve('/(tienda)/[categoria=categoria]', { categoria: slugIdParam(c, 'l') })
		}))
	]);

	// schema.org Product: una oferta por talla y color
	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'Product',
		name: producto.nombre,
		description: producto.descripcion ?? undefined,
		image: producto.colores.flatMap((c) => c.imagenes.map((i) => i.url)).slice(0, 10),
		sku: producto.id,
		brand: { '@type': 'Brand', name: data.tienda.nombre_tienda },
		category: producto.categorias[0]?.nombre,
		offers: {
			'@type': 'AggregateOffer',
			priceCurrency: 'BOB',
			lowPrice: producto.precio_desde,
			highPrice: producto.precio_hasta,
			offerCount: producto.colores.reduce((n, c) => n + c.skus.length, 0),
			availability: producto.agotado
				? 'https://schema.org/OutOfStock'
				: 'https://schema.org/InStock',
			url: new URL(canonicalPath, page.url.href).href
		}
	});
</script>

<TiendaSeo
	title={producto.nombre}
	tienda={data.tienda.nombre_tienda}
	description={producto.descripcion ?? `${producto.nombre} en ${data.tienda.nombre_tienda}.`}
	image={portada}
	{canonicalPath}
	type="product"
	{jsonLd}
/>

{#key producto.id}
	<TiendaProductoDetalle {producto} {migas} />
{/key}
