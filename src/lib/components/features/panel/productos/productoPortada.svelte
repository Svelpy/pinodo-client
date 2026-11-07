<script lang="ts">
	import { PhotoIcon } from '#lib/icons/outline/index.ts';
	import { cn } from '#lib/utils/index.ts';

	interface Props {
		/** Imagen de portada del producto; null si no tiene ninguna */
		url: string | null | undefined;
		alt: string;
		class?: string;
	}

	let { url, alt, class: className }: Props = $props();
</script>

<span
	class={cn(
		'flex size-12 shrink-0 items-center justify-center overflow-hidden bg-light-one_d text-light-four dark:bg-dark-one_d dark:text-dark-four',
		className
	)}
>
	{#if url}
		<img src={url} {alt} loading="lazy" decoding="async" class="size-full object-cover" />
	{:else}
		<PhotoIcon class="size-1/2" />
		<span class="sr-only">Sin imagen</span>
	{/if}
</span>
