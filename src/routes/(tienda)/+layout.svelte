<script lang="ts">
	import { onMount } from 'svelte';
	import { cubicOut } from 'svelte/easing';
	import { MediaQuery } from 'svelte/reactivity';
	import { fade, slide } from 'svelte/transition';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import {
		TiendaCesta,
		TiendaDrawer,
		TiendaFooter,
		TiendaHeader,
		TiendaLogo,
		TiendaMantenimiento,
		TiendaMenu,
		TiendaProgreso
	} from '#lib/components/features/tienda/index.ts';
	import { cestaAbierta, cestaCantidad, cestaStore } from '#lib/stores/index.ts';
	import { duracion } from '#lib/utils/index.ts';

	let { data, children } = $props();

	let menuMovil = $state(false);
	let menuEscritorio = $state(true);

	// La ficha y la cesta usan todo el ancho: el menú lateral solo se abre como drawer
	const sinMenuLateral = $derived(
		page.route.id === '/(tienda)/[producto=producto]' || page.route.id === '/(tienda)/cesta'
	);
	// lg: el botón muestra/oculta la columna lateral; en pantallas chicas abre el drawer
	const escritorio = new MediaQuery('min-width: 1024px');
	const usaLateral = $derived(escritorio.current && !sinMenuLateral);
	const menuLateral = $derived(menuEscritorio && !sinMenuLateral);

	// Cada página indica qué sección/categoría marcar en el menú
	const seccionActiva = $derived(page.data.seccionActiva as string | undefined);
	const categoriaActiva = $derived(page.data.categoriaActiva as string | undefined);
	const verTodoActivo = $derived(page.route.id === '/(tienda)/[seccion=seccion]');

	onMount(() => cestaStore.init());

	afterNavigate(() => {
		menuMovil = false;
	});

	function toggleMenu() {
		if (usaLateral) menuEscritorio = !menuEscritorio;
		else menuMovil = !menuMovil;
	}
</script>

<svelte:head>
	<meta name="apple-mobile-web-app-title" content={data.tienda.nombre_tienda} />
	{#if data.tienda.favicon_url}
		<link rel="icon" href={data.tienda.favicon_url} />
	{/if}
</svelte:head>

{#if data.mantenimiento}
	<TiendaMantenimiento tienda={data.tienda} />
{:else}
	<TiendaProgreso />

	<div
		class="flex min-h-dvh flex-col bg-light-one text-light-two dark:bg-dark-one dark:text-dark-two"
	>
		<a
			href="#contenido"
			class="sr-only z-50 bg-light-two px-4 py-2 text-editorial text-light-one focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
		>
			Ir al contenido
		</a>

		<TiendaHeader
			tienda={data.tienda}
			cantidad={$cestaCantidad}
			menuAbierto={usaLateral ? menuLateral : menuMovil}
			onMenu={toggleMenu}
			onCesta={cestaStore.abrir}
		/>

		<div class="relative flex flex-1 px-4 md:px-10 xl:px-12">
			{#if menuLateral && data.navegacion.length > 0}
				<aside
					class="hidden w-60 shrink-0 overflow-clip pr-8 lg:block"
					transition:slide={{ axis: 'x', duration: duracion(300), easing: cubicOut }}
				>
					<div class="sticky top-1 max-h-[calc(100dvh-9rem)] overflow-y-auto pb-10">
						<TiendaLogo tienda={data.tienda} class="mb-10" />
						<TiendaMenu
							navegacion={data.navegacion}
							{seccionActiva}
							{categoriaActiva}
							{verTodoActivo}
						/>
					</div>
				</aside>
			{/if}

			<main id="contenido" class="min-w-0 flex-1 pt-6 lg:pt-10">
				{#key page.url.pathname}
					<div in:fade={{ duration: duracion(280) }}>
						{@render children()}
					</div>
				{/key}
			</main>
		</div>

		<TiendaFooter tienda={data.tienda} />
	</div>

	<TiendaDrawer open={menuMovil} onClose={() => (menuMovil = false)} title="Menú" side="left">
		<TiendaLogo tienda={data.tienda} class="mb-8" onNavigate={() => (menuMovil = false)} />
		{#if data.navegacion.length > 0}
			<TiendaMenu
				navegacion={data.navegacion}
				{seccionActiva}
				{categoriaActiva}
				{verTodoActivo}
				onNavigate={() => (menuMovil = false)}
			/>
		{:else}
			<p class="text-editorial">Pronto agregaremos nuevas secciones.</p>
		{/if}
	</TiendaDrawer>

	<TiendaDrawer
		open={$cestaAbierta}
		onClose={cestaStore.cerrar}
		title="Cesta ({$cestaCantidad})"
		side="right"
	>
		<TiendaCesta tienda={data.tienda} onNavigate={cestaStore.cerrar} />
	</TiendaDrawer>
{/if}
