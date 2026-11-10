<script lang="ts">
	import { page } from '$app/state';
	import { TiendaCatalogo, TiendaSeo } from '#lib/components/features/tienda/index.ts';

	let { data } = $props();

	// Las páginas filtradas no se indexan: el contenido canónico es la home sin query
	const filtrada = $derived(page.url.search.length > 0);
</script>

<TiendaSeo
	tienda={data.tienda.nombre_tienda}
	description={data.tienda.descripcion}
	image={data.tienda.logo_url}
	canonicalPath="/"
	noIndex={filtrada}
	jsonLd={{
		'@context': 'https://schema.org',
		'@type': 'ClothingStore',
		name: data.tienda.nombre_tienda,
		description: data.tienda.descripcion ?? undefined,
		logo: data.tienda.logo_url ?? undefined,
		url: page.url.origin,
		telephone: data.tienda.telefono ?? undefined,
		email: data.tienda.email_contacto ?? undefined,
		address: data.tienda.direccion
			? {
					'@type': 'PostalAddress',
					streetAddress: data.tienda.direccion,
					addressLocality: data.tienda.ciudad ?? undefined
				}
			: undefined,
		sameAs: Object.values(data.tienda.redes_sociales ?? {})
	}}
/>

<TiendaCatalogo
	titulo="Novedades"
	productos={data.productos}
	opciones={data.opciones}
	filtros={data.filtros}
	query={data.query}
/>
