<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { TiendaCatalogo, TiendaSeo } from '#lib/components/features/tienda/index.ts';

	let { data } = $props();

	const filtrada = $derived(page.url.search.length > 0);
</script>

<TiendaSeo
	title={data.seccion.nombre}
	tienda={data.tienda.nombre_tienda}
	description="{data.seccion.nombre} en {data.tienda.nombre_tienda}. {data.tienda.descripcion ??
		''}"
	image={data.productos.data[0]?.portada_url}
	noIndex={filtrada}
/>

<TiendaCatalogo
	titulo={data.seccion.nombre}
	migas={[{ label: 'Inicio', href: resolve('/(tienda)') }]}
	productos={data.productos}
	opciones={data.opciones}
	filtros={data.filtros}
	query={data.query}
/>
