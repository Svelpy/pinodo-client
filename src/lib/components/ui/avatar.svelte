<script lang="ts">
	import { cn, formatInitials } from '#lib/utils/index.ts';

	type AvatarSize = 'sm' | 'md' | 'lg';
	type AvatarTone = 'primary' | 'accent';

	interface Props {
		/** Nombre de la persona o la tienda: de ahí salen las iniciales y el nombre accesible */
		name?: string | null;
		/** Imagen opcional; si no carga se muestran las iniciales */
		src?: string | null;
		size?: AvatarSize;
		tone?: AvatarTone;
		class?: string;
	}

	let { name, src, size = 'md', tone = 'primary', class: className }: Props = $props();

	// Imagen que falló: se muestran las iniciales y se reintenta si `src` cambia
	let failedSrc = $state<string | null>(null);
	const showImage = $derived(!!src && src !== failedSrc);

	const sizes: Record<AvatarSize, string> = {
		sm: 'size-7 text-xs',
		md: 'size-8 text-xs',
		lg: 'size-10 text-sm'
	};

	const tones: Record<AvatarTone, string> = {
		primary: 'bg-light-three text-light-one dark:bg-dark-three dark:text-dark-one',
		accent: 'bg-light-accent text-light-one dark:bg-dark-accent dark:text-dark-one'
	};
</script>

{#if showImage}
	<img
		{src}
		alt=""
		class={cn('shrink-0 rounded-md object-cover', sizes[size], className)}
		onerror={() => (failedSrc = src ?? null)}
	/>
{:else}
	<span
		class={cn(
			'flex shrink-0 items-center justify-center rounded-md font-semibold',
			sizes[size],
			tones[tone],
			className
		)}
		aria-hidden="true"
	>
		{formatInitials(name, { fallback: '' })}
	</span>
{/if}
