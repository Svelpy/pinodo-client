<script lang="ts">
	import { onMount } from 'svelte';
	import { TiendaCesta, TiendaSeo } from '#lib/components/features/tienda/index.ts';
	import { cestaCantidad, cestaStore } from '#lib/stores/index.ts';

	let { data } = $props();

	// En esta página la cesta ya está a la vista: el drawer no hace falta
	onMount(() => cestaStore.cerrar());
</script>

<TiendaSeo title="Cesta" tienda={data.tienda.nombre_tienda} noIndex />

<section class="mx-auto max-w-2xl" aria-labelledby="cesta-titulo">
	<h1 id="cesta-titulo" class="mb-8 text-editorial text-sm font-semibold">
		Cesta ({$cestaCantidad})
	</h1>
	<TiendaCesta tienda={data.tienda} />
</section>
