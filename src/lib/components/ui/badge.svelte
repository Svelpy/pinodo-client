<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '#lib/utils/index.ts';

	type BadgeVariant =
		'default' | 'secondary' | 'outline' | 'info' | 'success' | 'warning' | 'error' | 'destructive';
	type BadgeSize = 'sm' | 'md';

	interface Props extends HTMLAttributes<HTMLSpanElement> {
		children?: Snippet;
		variant?: BadgeVariant;
		size?: BadgeSize;
		/** Punto de estado antes del texto (p. ej. "Activa") */
		dot?: boolean;
	}

	let {
		variant = 'default',
		size = 'md',
		dot = false,
		class: className,
		children,
		...restProps
	}: Props = $props();

	// Colores de la paleta de layout.css. Cada clase light-* tiene su par dark-* con el mismo
	// sufijo y opacidad, así el modo oscuro se ajusta solo cambiando la paleta.
	// Los textos de estado se oscurecen con color-mix para tener contraste sobre el fondo tenue.
	const variants: Record<BadgeVariant, string> = {
		default:
			'border-transparent bg-light-three text-light-one dark:bg-dark-three dark:text-dark-one',
		secondary:
			'border-light-one_d bg-light-one_d text-light-three dark:border-dark-one_d dark:bg-dark-one_d dark:text-dark-three',
		outline:
			'border-light-four bg-transparent text-light-two dark:border-dark-four dark:text-dark-two',
		info: 'border-light-three/15 bg-light-three/10 text-light-three dark:border-dark-three/15 dark:bg-dark-three/10 dark:text-dark-three',
		success:
			'border-light-success/25 bg-light-success/10 text-[color-mix(in_oklab,var(--color-light-success)_70%,black)] dark:border-dark-success/25 dark:bg-dark-success/10 dark:text-[color-mix(in_oklab,var(--color-dark-success)_70%,black)]',
		warning:
			'border-light-warning/30 bg-light-warning/15 text-[color-mix(in_oklab,var(--color-light-warning)_60%,black)] dark:border-dark-warning/30 dark:bg-dark-warning/15 dark:text-[color-mix(in_oklab,var(--color-dark-warning)_60%,black)]',
		error:
			'border-light-error/25 bg-light-error/10 text-[color-mix(in_oklab,var(--color-light-error)_80%,black)] dark:border-dark-error/25 dark:bg-dark-error/10 dark:text-[color-mix(in_oklab,var(--color-dark-error)_80%,black)]',
		destructive:
			'border-transparent bg-[color-mix(in_oklab,var(--color-light-error)_80%,black)] text-light-one dark:bg-[color-mix(in_oklab,var(--color-dark-error)_80%,black)] dark:text-dark-one'
	};

	const sizes: Record<BadgeSize, string> = {
		sm: 'gap-1 px-2 py-px text-[0.6875rem]',
		md: 'gap-1.5 px-2.5 py-0.5 text-xs'
	};
</script>

<span
	class={cn(
		'inline-flex w-fit shrink-0 items-center border leading-5 font-medium tracking-[0.06em] whitespace-nowrap uppercase transition-colors',
		'focus-visible:ring-2 focus-visible:ring-light-three focus-visible:ring-offset-2 focus-visible:ring-offset-light-one focus-visible:outline-none dark:focus-visible:ring-dark-three dark:focus-visible:ring-offset-dark-one',
		sizes[size],
		variants[variant],
		className
	)}
	{...restProps}
>
	{#if dot}
		<span class="size-1.5 shrink-0 bg-current" aria-hidden="true"></span>
	{/if}
	{#if children}
		{@render children()}
	{/if}
</span>
