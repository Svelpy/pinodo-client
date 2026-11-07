<script lang="ts">
	import { APP_SITE_CONFIG } from '#lib/constants/index.ts';
	import type { MainLayoutProps } from '#lib/interfaces/index.ts';
	import type { Snippet } from 'svelte';

	import { PUBLIC_SITE_URL } from '$app/env/public';
	const APP_URL = PUBLIC_SITE_URL;

	// ── Props
	interface Props {
		title: MainLayoutProps['title'];
		description?: MainLayoutProps['description'];
		keywords?: MainLayoutProps['keywords'];
		ogImage?: MainLayoutProps['ogImage'];
		ogType?: MainLayoutProps['ogType'];
		canonicalUrl?: MainLayoutProps['canonicalUrl'];
		noIndex?: MainLayoutProps['noIndex'];
		class?: string;
		children: Snippet;
	}
	let {
		title,
		description = '',
		keywords = [],
		ogImage = APP_SITE_CONFIG.DEFAULT_OG_IMAGE,
		ogType = 'website',
		canonicalUrl = '',
		noIndex = false,
		class: className = '',
		children
	}: Props = $props();
</script>

<!-- ── Head  -->
<svelte:head>
	<!-- Primary -->
	<title>{title}</title>
	{#if description}
		<meta name="description" content={description} />
	{/if}
	{#if keywords.length > 0}
		<meta name="keywords" content={keywords.join(', ')} />
	{/if}
	{#if noIndex}
		<meta name="robots" content="noindex, nofollow" />
	{:else}
		<meta name="robots" content="index, follow" />
	{/if}

	<!-- Canonical -->
	{#if canonicalUrl}
		<link rel="canonical" href={`${APP_URL}${canonicalUrl}`} />
	{:else}
		<link rel="canonical" href={`${APP_URL}`} />
	{/if}

	<!-- Open Graph -->
	<meta property="og:type" content={ogType} />
	<meta property="og:title" content={title} />
	<meta property="og:site_name" content={APP_SITE_CONFIG.APP_NAME} />
	{#if description}
		<meta property="og:description" content={description} />
	{/if}
	{#if canonicalUrl}
		<meta property="og:url" content={`${APP_URL}${canonicalUrl}`} />
	{:else}
		<meta property="og:url" content={`${APP_URL}`} />
	{/if}
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />

	<!-- Twitter Card -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content={APP_SITE_CONFIG.APP_TWITTER_HANDLE} />
	<meta name="twitter:title" content={title} />
	{#if description}
		<meta name="twitter:description" content={description} />
	{/if}
	<meta name="twitter:image" content={ogImage} />
</svelte:head>
<div class={className}>
	{@render children?.()}
</div>
