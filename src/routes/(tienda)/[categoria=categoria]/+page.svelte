<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { TiendaCatalogo, TiendaSeo } from '#lib/components/features/tienda/index.ts';
	import { slugIdParam } from '#lib/utils/index.ts';

	let { data } = $props();

	const filtrada = $derived(page.url.search.length > 0);

	// Sección › categorías ancestro (la actual va como título)
	const migas = $derived([
		{
			label: data.ubicacion.seccion.nombre,
			href: resolve('/(tienda)/[seccion=seccion]', { seccion: data.ubicacion.seccion.slug })
		},
		...data.ubicacion.ruta.slice(0, -1).map((c) => ({
			label: c.nombre,
			href: resolve('/(tienda)/[categoria=categoria]', { categoria: slugIdParam(c, 'l') })
		}))
	]);

	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: [...migas, { label: data.categoria.nombre, href: page.url.pathname }].map(
			(miga, index) => ({
				'@type': 'ListItem',
				position: index + 1,
				name: miga.label,
				item: new URL(miga.href, page.url.href).href
			})
		)
	});
</script>

<TiendaSeo
	title="{data.categoria.nombre} · {data.ubicacion.seccion.nombre}"
	tienda={data.tienda.nombre_tienda}
	description="{data.categoria.nombre} de {data.ubicacion.seccion.nombre} en {data.tienda
		.nombre_tienda}."
	image={data.productos.data[0]?.portada_url}
	noIndex={filtrada}
	{jsonLd}
/>

<TiendaCatalogo
	titulo={data.categoria.nombre}
	{migas}
	productos={data.productos}
	opciones={data.opciones}
	filtros={data.filtros}
	query={data.query}
/>
