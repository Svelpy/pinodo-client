<script lang="ts">
	import { cubicOut } from 'svelte/easing';
	import { fade, fly, scale, slide } from 'svelte/transition';
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import type { TiendaProductoColor, TiendaProductoDetalle } from '#lib/interfaces/index.ts';
	import { cestaStore } from '#lib/stores/index.ts';
	import { duracion, imagenSrcset, imagenUrl } from '#lib/utils/index.ts';
	import TiendaPrecio from './tiendaPrecio.svelte';

	interface Props {
		producto: TiendaProductoDetalle;
		migas?: { label: string; href: string }[];
	}

	let { producto, migas = [] }: Props = $props();

	function colorInicial(): TiendaProductoColor | undefined {
		const pedido = page.url.searchParams.get('color');
		return (
			producto.colores.find((c) => c.color.id === pedido) ??
			producto.colores.find((c) => !c.agotado) ??
			producto.colores[0]
		);
	}

	// Se reinician al cambiar de producto
	let colorId = $derived(colorInicial()?.id);
	let skuId = $derived<string | null>(null);
	let aviso = $state('');

	const color = $derived(producto.colores.find((c) => c.id === colorId));
	const sku = $derived(color?.skus.find((s) => s.id === skuId));
	const imagenes = $derived(color?.imagenes ?? []);

	// Precio mostrado: el de la talla elegida o el rango del color
	const precios = $derived.by(() => {
		if (sku) {
			return {
				precio_desde: sku.precio_vigente,
				precio_hasta: sku.precio_vigente,
				precio_normal_desde: sku.precio_normal,
				precio_normal_hasta: sku.precio_normal,
				en_rebaja: sku.en_rebaja
			};
		}
		const skus = color?.skus ?? [];
		if (skus.length === 0) return producto;
		const vigentes = skus.map((s) => s.precio_vigente);
		const normales = skus.map((s) => s.precio_normal);
		return {
			precio_desde: Math.min(...vigentes),
			precio_hasta: Math.max(...vigentes),
			precio_normal_desde: Math.min(...normales),
			precio_normal_hasta: Math.max(...normales),
			en_rebaja: skus.some((s) => s.en_rebaja)
		};
	});

	// Precios y stock de la cesta al día con la ficha
	$effect(() => {
		cestaStore.sincronizar(producto);
	});

	function elegirColor(id: string) {
		if (id === colorId) return;
		colorId = id;
		skuId = null;
		aviso = '';
		const elegido = producto.colores.find((c) => c.id === id);
		if (!elegido) return;
		// Enlace compartible al color sin volver a ejecutar el load
		const url = new URL(page.url.href);
		url.searchParams.set('color', elegido.color.id);
		// eslint-disable-next-line svelte/no-navigation-without-resolve -- misma ruta, solo cambia la query
		replaceState(url, page.state);
	}

	function agregar() {
		if (!color) return;
		if (!sku) {
			aviso = 'Elige una talla.';
			return;
		}
		if (!sku.disponible) return;
		aviso = '';
		cestaStore.agregar({
			sku_id: sku.id,
			producto_id: producto.id,
			slug: producto.slug,
			nombre: producto.nombre,
			color: color.color.nombre,
			color_id: color.color.id,
			talla: sku.talla.etiqueta,
			precio: sku.precio_vigente,
			precio_normal: sku.precio_normal,
			imagen: color.imagenes[0]?.url ?? null,
			cantidad: 1
		});
	}

	// Entrada escalonada del panel de compra al abrir la ficha
	const entrada = (paso: number) => ({
		y: 16,
		duration: duracion(450),
		delay: duracion(80) && paso * 70,
		easing: cubicOut
	});

	const detalles = $derived(
		[
			{ titulo: 'Descripción', texto: producto.descripcion },
			{ titulo: 'Composición', texto: producto.composicion },
			{ titulo: 'Cuidados', texto: producto.cuidados }
		].filter((d): d is { titulo: string; texto: string } => Boolean(d.texto?.trim()))
	);
	// Acordeón: uno abierto a la vez, el primero por defecto
	let detalleAbierto = $derived<string | null>(detalles[0]?.titulo ?? null);
</script>

<!-- eslint-disable svelte/no-navigation-without-resolve -- las migas llegan ya resueltas -->
<article class="grid gap-8 lg:grid-cols-12 lg:gap-12">
	<!-- Galería: carrusel con scroll-snap en móvil, imágenes apiladas en escritorio -->
	<div class="-mx-4 md:mx-0 lg:col-span-7">
		{#if imagenes.length > 0}
			<!-- Al cambiar de color la galería se reemplaza con un fundido -->
			{#key colorId}
				<ul
					in:fade={{ duration: duracion(400) }}
					class="scrollbar-hide flex snap-x snap-mandatory overflow-x-auto lg:flex-col lg:gap-2 lg:overflow-visible"
					aria-label="Imágenes de {producto.nombre}"
				>
					{#each imagenes as imagen, index (`${index}-${imagen.url}`)}
						<li class="w-full shrink-0 snap-center">
							<img
								src={imagenUrl(imagen.url, 1000)}
								srcset={imagenSrcset(imagen.url)}
								sizes="(min-width: 1024px) 55vw, 100vw"
								alt="{producto.nombre} — {color?.color.nombre} ({index + 1} de {imagenes.length})"
								loading={index === 0 ? 'eager' : 'lazy'}
								fetchpriority={index === 0 ? 'high' : 'auto'}
								decoding="async"
								class="aspect-3/4 w-full bg-light-one_d object-cover dark:bg-dark-one_d"
							/>
						</li>
					{/each}
				</ul>
			{/key}
			{#if imagenes.length > 1}
				<p class="mt-2 text-center text-editorial text-light-two_d lg:hidden dark:text-dark-two_d">
					Desliza para ver {imagenes.length} imágenes
				</p>
			{/if}
		{:else}
			<div class="aspect-3/4 w-full bg-light-one_d dark:bg-dark-one_d" aria-hidden="true"></div>
		{/if}
	</div>

	<div class="lg:col-span-5">
		<div class="max-w-md space-y-8 text-editorial lg:sticky lg:top-32">
			<header class="space-y-3" in:fly|global={entrada(0)}>
				{#if migas.length > 0}
					<nav aria-label="Ruta de navegación" class="text-light-two_d dark:text-dark-two_d">
						<ol class="flex flex-wrap gap-x-2">
							{#each migas as miga, index (miga.href)}
								<li class="flex gap-2">
									{#if index > 0}<span aria-hidden="true">/</span>{/if}
									<a href={miga.href} class="hover:underline hover:underline-offset-4"
										>{miga.label}</a
									>
								</li>
							{/each}
						</ol>
					</nav>
				{/if}
				<h1 class="text-sm font-semibold md:text-base">{producto.nombre}</h1>
				<!-- El precio cambia al elegir color o talla -->
				{#key `${precios.precio_desde}-${precios.precio_hasta}-${precios.en_rebaja}`}
					<div in:fly={{ y: -6, duration: duracion(260), easing: cubicOut }}>
						<TiendaPrecio {precios} class="text-sm" />
					</div>
				{/key}
				{#if sku?.en_rebaja && sku.rebaja_hasta}
					<p
						class="text-light-two_d dark:text-dark-two_d"
						transition:slide={{ duration: duracion(220) }}
					>
						Rebaja hasta el {new Date(`${sku.rebaja_hasta}T00:00:00`).toLocaleDateString('es-BO', {
							day: 'numeric',
							month: 'long'
						})}
					</p>
				{/if}
			</header>

			{#if producto.colores.length > 0}
				<fieldset in:fly|global={entrada(1)}>
					<legend class="mb-3">
						Color:
						{#key color?.id}
							<span class="font-semibold" in:fade={{ duration: duracion(200) }}>
								{color?.color.nombre}
							</span>
						{/key}
					</legend>
					<div class="flex flex-wrap gap-3">
						{#each producto.colores as opcion (opcion.id)}
							<label class="cursor-pointer" title={opcion.color.nombre}>
								<input
									type="radio"
									name="color"
									value={opcion.id}
									checked={opcion.id === colorId}
									onchange={() => elegirColor(opcion.id)}
									class="peer sr-only"
								/>
								<span class="sr-only"
									>{opcion.color.nombre}{opcion.agotado ? ' (agotado)' : ''}</span
								>
								<span
									class={[
										'relative block size-7 border border-light-two/25 ring-current ring-offset-2 peer-checked:ring-1 peer-focus-visible:outline-1 peer-focus-visible:outline-offset-4 dark:border-dark-two/30 dark:ring-offset-dark-one',
										opcion.agotado && 'opacity-40'
									]}
									style:background-color={opcion.color.codigo_hex ?? 'transparent'}
									aria-hidden="true"
								></span>
							</label>
						{/each}
					</div>
				</fieldset>
			{/if}

			{#if color && color.skus.length > 0}
				<fieldset in:fly|global={entrada(2)}>
					<legend class="mb-3">Talla</legend>
					<div class="grid grid-cols-4 gap-2 sm:grid-cols-5">
						<!-- Las tallas del color nuevo entran en cascada -->
						{#each color.skus as opcion, index (opcion.id)}
							<label
								class={opcion.disponible ? 'cursor-pointer' : 'cursor-not-allowed'}
								in:scale={{
									start: 0.9,
									duration: duracion(250),
									delay: duracion(30) && index * 30,
									easing: cubicOut
								}}
							>
								<input
									type="radio"
									name="talla"
									value={opcion.id}
									disabled={!opcion.disponible}
									bind:group={skuId}
									onchange={() => (aviso = '')}
									class="peer sr-only"
								/>
								<span
									class="flex h-10 items-center justify-center border border-light-two/25 px-2 peer-checked:border-current peer-checked:bg-light-two peer-checked:text-light-one peer-focus-visible:outline-1 peer-focus-visible:outline-offset-2 peer-disabled:text-light-two_d peer-disabled:line-through dark:border-dark-two/30 dark:peer-checked:bg-dark-two dark:peer-checked:text-dark-one dark:peer-disabled:text-dark-two_d"
								>
									{opcion.talla.etiqueta}
								</span>
								{#if !opcion.disponible}<span class="sr-only">(agotada)</span>{/if}
							</label>
						{/each}
					</div>
				</fieldset>
			{/if}

			<div class="space-y-2" in:fly|global={entrada(3)}>
				<button
					type="button"
					onclick={agregar}
					disabled={!color || color.agotado}
					class="h-12 w-full bg-light-two text-light-one transition-colors hover:bg-light-three disabled:cursor-not-allowed disabled:bg-light-four dark:bg-dark-two dark:text-dark-one dark:disabled:bg-dark-four"
				>
					{color?.agotado ? 'Agotado' : 'Añadir a la cesta'}
				</button>
				<p class="min-h-5 text-light-error dark:text-dark-error" role="status" aria-live="polite">
					{#if aviso}
						<span class="block" transition:fly={{ y: -6, duration: duracion(220) }}>{aviso}</span>
					{/if}
				</p>
			</div>

			{#if detalles.length > 0}
				<div
					class="divide-y divide-light-two/15 border-y border-light-two/15 dark:divide-dark-two/15 dark:border-dark-two/15"
					in:fly|global={entrada(4)}
				>
					{#each detalles as detalle (detalle.titulo)}
						{@const abierto = detalleAbierto === detalle.titulo}
						<section>
							<h2>
								<button
									type="button"
									aria-expanded={abierto}
									onclick={() => (detalleAbierto = abierto ? null : detalle.titulo)}
									class="flex w-full items-center justify-between py-4 text-left"
								>
									{detalle.titulo}
									{#key abierto}
										<span
											class="text-base leading-none font-extralight"
											aria-hidden="true"
											in:scale={{ start: 0.4, duration: duracion(200) }}
										>
											{abierto ? '−' : '+'}
										</span>
									{/key}
								</button>
							</h2>
							{#if abierto}
								<div transition:slide={{ duration: duracion(280), easing: cubicOut }}>
									<p
										class="pb-5 text-sm leading-relaxed tracking-normal whitespace-pre-line normal-case"
									>
										{detalle.texto}
									</p>
								</div>
							{/if}
						</section>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</article>
