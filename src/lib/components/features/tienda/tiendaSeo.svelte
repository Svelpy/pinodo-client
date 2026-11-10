<script lang="ts">
	import { page } from '$app/state';

	interface Props {
		/** Título de la página; se le agrega el nombre de la tienda */
		title?: string;
		tienda: string;
		description?: string | null;
		image?: string | null;
		/** Ruta canónica (sin query, absoluta o relativa a la página); por defecto la ruta actual */
		canonicalPath?: string;
		noIndex?: boolean;
		type?: 'website' | 'product';
		/** Datos estructurados (schema.org) */
		jsonLd?: Record<string, unknown> | Record<string, unknown>[];
	}

	let {
		title,
		tienda,
		description,
		image,
		canonicalPath,
		noIndex = false,
		type = 'website',
		jsonLd
	}: Props = $props();

	const fullTitle = $derived(title ? `${title} | ${tienda}` : tienda);
	// resolve() puede devolver rutas relativas ("./x"): se resuelven contra la URL actual
	const canonical = $derived(new URL(canonicalPath ?? page.url.pathname, page.url.href).href);
	const desc = $derived(description?.trim().slice(0, 160) || undefined);
	// `<` escapado: el JSON no puede cerrar el <script>
	const ldJson = $derived(jsonLd ? JSON.stringify(jsonLd).replace(/</g, '\\u003c') : null);
	// Etiqueta armada por partes: un cierre de script literal terminaría el bloque de este componente
	const ldScript = $derived(
		ldJson ? `<script type="application/ld+json">${ldJson}<${'/'}script>` : null
	);
</script>

<svelte:head>
	<title>{fullTitle}</title>
	{#if desc}
		<meta name="description" content={desc} />
		<meta property="og:description" content={desc} />
	{/if}
	{#if noIndex}
		<meta name="robots" content="noindex, follow" />
	{:else}
		<link rel="canonical" href={canonical} />
	{/if}
	<meta property="og:title" content={fullTitle} />
	<meta property="og:site_name" content={tienda} />
	<meta property="og:type" content={type} />
	<meta property="og:url" content={canonical} />
	{#if image}
		<meta property="og:image" content={image} />
		<meta name="twitter:card" content="summary_large_image" />
	{/if}
	{#if ldScript}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- JSON serializado y escapado arriba -->
		{@html ldScript}
	{/if}
</svelte:head>
