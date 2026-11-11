<script lang="ts">
	import { PhotoIcon } from '#lib/icons/outline/index.ts';
	import { cn, imagenUrl } from '#lib/utils/index.ts';

	interface Props {
		url: string;
		alt: string;
		/** Ancho al que se pide la imagen a Cloudinary (las demás URLs se usan tal cual) */
		width?: number;
		fit?: 'cover' | 'contain';
		class?: string;
	}

	let { url, alt, width = 480, fit = 'cover', class: className }: Props = $props();

	// La imagen puede haberse borrado de Cloudinary: se muestra un marcador en vez de un icono roto
	let failedUrl = $state<string | null>(null);
	const failed = $derived(failedUrl === url);
</script>

<span
	class={cn(
		'flex items-center justify-center overflow-hidden bg-light-one_d text-light-four dark:bg-dark-one_d dark:text-dark-four',
		className
	)}
>
	{#if failed}
		<PhotoIcon class="size-1/3" />
		<span class="sr-only">No se pudo cargar la imagen</span>
	{:else}
		<img
			src={imagenUrl(url, width) ?? url}
			{alt}
			loading="lazy"
			decoding="async"
			onerror={() => (failedUrl = url)}
			class={['size-full', fit === 'cover' ? 'object-cover' : 'object-contain']}
		/>
	{/if}
</span>
