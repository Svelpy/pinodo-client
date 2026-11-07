<script lang="ts">
	import type { HTMLImgAttributes } from 'svelte/elements';
	import { cn } from '#lib/utils/index.ts';

	type ObjectFit = 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
	type ImageStatus = 'loading' | 'loaded' | 'error';

	interface Props extends HTMLImgAttributes {
		src: string;
		alt: string;
		objectFit?: ObjectFit;
		class?: string;
		containerClass?: string;
	}

	let {
		src,
		alt,
		objectFit = 'cover',
		class: className,
		containerClass,
		...restProps
	}: Props = $props();

	let status = $state<ImageStatus>('loading');

	const handleLoad = () => {
		status = 'loaded';
	};

	const handleError = () => {
		status = 'error';
	};

	const imageClasses = $derived(
		cn(
			'h-full w-full transition-opacity duration-300',
			status === 'loaded' ? 'opacity-100' : 'opacity-0',
			`object-${objectFit}`,
			className
		)
	);
</script>

<div class={cn('relative h-full w-full overflow-hidden', containerClass)}>
	{#if status === 'loading'}
		<div class="bg-muted h-full w-full animate-pulse"></div>
	{/if}

	{#if status === 'error'}
		<div class="bg-muted text-muted-foreground flex h-full w-full items-center justify-center">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="h-6 w-6"
			>
				<path d="M21.2 21.2 3 3" />
				<path d="m22 12-4.24-4.24" />
				<path d="M8.24 3.76 3 9" />
				<path d="M3 15h6" />
				<path d="M12.5 12.5 18 18" />
				<path d="M15 21h6" />
			</svg>
		</div>
	{/if}

	<img
		{src}
		{alt}
		class={imageClasses}
		loading="lazy"
		decoding="async"
		onload={handleLoad}
		onerror={handleError}
		{...restProps}
	/>
</div>
