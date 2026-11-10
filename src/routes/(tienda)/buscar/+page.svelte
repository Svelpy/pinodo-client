<script lang="ts">
	import { resolve } from '$app/paths';
	import { TiendaCatalogo, TiendaSeo } from '#lib/components/features/tienda/index.ts';

	let { data } = $props();
</script>

<TiendaSeo
	title={data.q ? `Buscar: ${data.q}` : 'Buscar'}
	tienda={data.tienda.nombre_tienda}
	noIndex
/>

<form method="GET" action={resolve('/(tienda)/buscar')} role="search" class="mb-12 max-w-2xl">
	<label for="buscar-q" class="mb-2 block text-editorial text-light-two_d dark:text-dark-two_d">
		¿Qué estás buscando?
	</label>
	<input
		id="buscar-q"
		name="q"
		type="search"
		value={data.q}
		maxlength="100"
		placeholder="Vestido, jean, camisa…"
		autocomplete="off"
		class="w-full border-0 border-b border-current bg-transparent px-0 pb-2 text-xl font-light tracking-[0.12em] uppercase placeholder:tracking-normal placeholder:text-light-four placeholder:normal-case focus:ring-0 md:text-3xl dark:placeholder:text-dark-four_d"
	/>
</form>

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
