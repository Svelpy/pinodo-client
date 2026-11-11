<script lang="ts">
	import { page } from '$app/state';

	interface SeoImagen {
		url: string;
		width?: number;
		height?: number;
		alt?: string;
	}

	/** Metadatos de producto (Open Graph `product:*`, los leen Facebook/Instagram y Pinterest) */
	interface SeoProducto {
		precio: number;
		/** Precio sin rebaja; solo si está en rebaja */
		precioNormal?: number;
		moneda: string;
		disponible: boolean;
		marca: string;
		sku: string;
	}

	interface Props {
		/** Título de la página; se le agrega el nombre de la tienda */
		title?: string;
		tienda: string;
		description?: string | null;
		image?: string | SeoImagen | null;
		/** Ruta canónica (sin query, absoluta o relativa a la página); por defecto la ruta actual */
		canonicalPath?: string;
		/** URL que se comparte (`og:url`), p. ej. con el color elegido; por defecto la canónica */
		ogUrl?: string;
		noIndex?: boolean;
		type?: 'website' | 'product';
		product?: SeoProducto;
		/** Datos estructurados (schema.org) */
		jsonLd?: Record<string, unknown> | Record<string, unknown>[];
	}

	let {
		title,
		tienda,
		description,
		image,
		canonicalPath,
		ogUrl,
		noIndex = false,
		type = 'website',
		product,
		jsonLd
	}: Props = $props();

	const fullTitle = $derived(title ? `${title} | ${tienda}` : tienda);
	// resolve() puede devolver rutas relativas ("./x"): se resuelven contra la URL actual
	const canonical = $derived(new URL(canonicalPath ?? page.url.pathname, page.url.href).href);
	const compartida = $derived(ogUrl ? new URL(ogUrl, page.url.href).href : canonical);
	const desc = $derived(description?.trim().slice(0, 160) || undefined);
	const img = $derived.by((): SeoImagen | null => {
		if (!image) return null;
		const datos = typeof image === 'string' ? { url: image } : image;
		// Las redes exigen URLs absolutas
		return { ...datos, url: new URL(datos.url, page.url.href).href };
	});
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
		<meta name="twitter:description" content={desc} />
	{/if}
	{#if noIndex}
		<meta name="robots" content="noindex, follow" />
	{:else}
		<link rel="canonical" href={canonical} />
	{/if}
	<meta property="og:locale" content="es_BO" />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:site_name" content={tienda} />
	<meta property="og:type" content={type} />
	<meta property="og:url" content={compartida} />
	<meta name="twitter:title" content={fullTitle} />
	{#if img}
		<meta property="og:image" content={img.url} />
		{#if img.url.startsWith('https:')}
			<meta property="og:image:secure_url" content={img.url} />
		{/if}
		{#if img.width && img.height}
			<meta property="og:image:width" content={String(img.width)} />
			<meta property="og:image:height" content={String(img.height)} />
		{/if}
		{#if img.alt}
			<meta property="og:image:alt" content={img.alt} />
			<meta name="twitter:image:alt" content={img.alt} />
		{/if}
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:image" content={img.url} />
	{:else}
		<meta name="twitter:card" content="summary" />
	{/if}
	{#if product}
		<meta property="product:brand" content={product.marca} />
		<meta property="product:retailer_item_id" content={product.sku} />
		<meta
			property="product:availability"
			content={product.disponible ? 'in stock' : 'out of stock'}
		/>
		<meta property="product:condition" content="new" />
		<meta property="product:price:amount" content={product.precio.toFixed(2)} />
		<meta property="product:price:currency" content={product.moneda} />
		{#if product.precioNormal !== undefined && product.precioNormal > product.precio}
			<meta property="product:original_price:amount" content={product.precioNormal.toFixed(2)} />
			<meta property="product:original_price:currency" content={product.moneda} />
		{/if}
	{/if}
	{#if ldScript}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- JSON serializado y escapado arriba -->
		{@html ldScript}
	{/if}
</svelte:head>
