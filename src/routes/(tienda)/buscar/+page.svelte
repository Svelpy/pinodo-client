<script lang="ts">
	import {
		TiendaBuscador,
		TiendaCatalogo,
		TiendaSeo
	} from '#lib/components/features/tienda/index.ts';

	let { data } = $props();
</script>

<TiendaSeo
	title={data.q ? `Buscar: ${data.q}` : 'Buscar'}
	tienda={data.tienda.nombre_tienda}
	noIndex
/>

<!-- Busca solo al dejar de escribir (ver TiendaBuscador) -->
<TiendaBuscador
	id="buscar-q"
	label="¿Qué estás buscando?"
	labelVisible
	placeholder="Vestido, jean, camisa…"
	class="mb-12 max-w-2xl"
	labelClass="mb-2 block text-editorial text-light-two_d dark:text-dark-two_d"
	inputClass="w-full border-0 border-b border-current bg-transparent px-0 pb-2 font-editorial text-xl font-light tracking-[0.04em] uppercase placeholder:tracking-normal placeholder:text-light-four placeholder:normal-case focus:ring-0 md:text-3xl dark:placeholder:text-dark-four_d"
/>

{#if data.catalogo}
	<TiendaCatalogo
		titulo="Resultados para “{data.q}”"
		productos={data.catalogo.productos}
		opciones={data.catalogo.opciones}
		filtros={data.catalogo.filtros}
		query={data.catalogo.query}
	>
		{#snippet vacio()}
			<p>No encontramos productos para “{data.q}”.</p>
			<p class="mt-2 text-light-two_d dark:text-dark-two_d">
				Prueba con otra palabra o revisa la ortografía.
			</p>
		{/snippet}
	</TiendaCatalogo>
{/if}
