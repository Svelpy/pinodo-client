<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { TiendaProductoDetalle, TiendaSeo } from '#lib/components/features/tienda/index.ts';
	import { formatCurrency, imagenOg, productoUrlCompartir, slugIdParam } from '#lib/utils/index.ts';

	let { data } = $props();

	const producto = $derived(data.producto);
	const tienda = $derived(data.tienda);
	const canonicalPath = $derived(
		resolve('/(tienda)/[producto=producto]', { producto: slugIdParam(producto, 'p') })
	);
	const canonical = $derived(new URL(canonicalPath, page.url.href).href);

	// Enlace compartido con ?color=: la vista previa muestra ese color (se resuelve en SSR)
	const colorCompartido = $derived(
		producto.colores.find((c) => c.color.id === page.url.searchParams.get('color'))
	);
	const colorPreview = $derived(
		colorCompartido?.imagenes.length
			? colorCompartido
			: producto.colores.find((c) => c.imagenes.length > 0)
	);
	const ogImagen = $derived.by(() => {
		const og = imagenOg(colorPreview?.imagenes[0]?.url ?? tienda.logo_url);
		if (!og) return null;
		const alt = colorPreview
			? `${producto.nombre} — ${colorPreview.color.nombre}`
			: `${producto.nombre} en ${tienda.nombre_tienda}`;
		return { ...og, alt };
	});

	const descripcion = $derived(
		producto.descripcion?.trim() ||
			`${producto.nombre} ${
				producto.precio_desde === producto.precio_hasta ? 'a' : 'desde'
			} ${formatCurrency(producto.precio_desde)} en ${tienda.nombre_tienda}.`
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

	// schema.org: Product (oferta agregada de tallas y colores) + migas de pan
	const jsonLd = $derived([
		{
			'@context': 'https://schema.org',
			'@type': 'Product',
			name: producto.nombre,
			description: producto.descripcion ?? undefined,
			url: canonical,
			image: producto.colores.flatMap((c) => c.imagenes.map((i) => i.url)).slice(0, 10),
			sku: producto.id,
			brand: { '@type': 'Brand', name: tienda.nombre_tienda },
			category: producto.categorias[0]?.nombre,
			color: producto.colores.map((c) => c.color.nombre).join(', ') || undefined,
			offers: {
				'@type': 'AggregateOffer',
				priceCurrency: 'BOB',
				lowPrice: producto.precio_desde,
				highPrice: producto.precio_hasta,
				offerCount: producto.colores.reduce((n, c) => n + c.skus.length, 0),
				itemCondition: 'https://schema.org/NewCondition',
				availability: producto.agotado
					? 'https://schema.org/OutOfStock'
					: 'https://schema.org/InStock',
				url: canonical,
				seller: {
					'@type': 'Organization',
					name: tienda.nombre_tienda,
					logo: tienda.logo_url ?? undefined,
					url: page.url.origin
				}
			}
		},
		{
			'@context': 'https://schema.org',
			'@type': 'BreadcrumbList',
			itemListElement: [
				{ label: tienda.nombre_tienda, href: resolve('/(tienda)') },
				...migas,
				{ label: producto.nombre, href: canonicalPath }
			].map((miga, index) => ({
				'@type': 'ListItem',
				position: index + 1,
				name: miga.label,
				item: new URL(miga.href, page.url.href).href
			}))
		}
	]);
</script>

<TiendaSeo
	title={producto.nombre}
	tienda={tienda.nombre_tienda}
	description={descripcion}
	image={ogImagen}
	{canonicalPath}
	ogUrl={productoUrlCompartir(page.url.origin, producto, colorCompartido?.color.id)}
	type="product"
	product={{
		precio: producto.precio_desde,
		precioNormal: producto.en_rebaja ? producto.precio_normal_desde : undefined,
		moneda: 'BOB',
		disponible: !producto.agotado,
		marca: tienda.nombre_tienda,
		sku: producto.id
	}}
	{jsonLd}
/>

{#key producto.id}
	<TiendaProductoDetalle {producto} tienda={tienda.nombre_tienda} {migas} />
{/key}
