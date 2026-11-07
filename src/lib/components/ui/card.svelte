<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	interface CardProps extends HTMLAttributes<HTMLDivElement> {
		variant?: 'default' | 'bordered' | 'elevated' | 'ghost';
		size?: 'sm' | 'md' | 'lg';
		interactive?: boolean;
		disabled?: boolean;
		padding?: 'none' | 'sm' | 'md' | 'lg';
		header?: Snippet;
		footer?: Snippet;
		children: Snippet;
		class?: string;
	}

	let {
		variant = 'default',
		size = 'md',
		interactive = false,
		disabled = false,
		padding = 'md',
		header,
		footer,
		children,
		class: additionalClass = '',
		onclick,
		...restProps
	}: CardProps = $props();

	// Clases base estáticas
	const baseClasses = ' transition-all duration-200 ease-in-out';

	// Diccionarios de estilos (estos pueden ser const porque no cambian)
	const variantStyles = {
		default: 'bg-white border border-gray-200  dark:bg-gray-900 dark:border-gray-800',
		bordered: 'bg-white border-2 border-gray-300 dark:bg-gray-900 dark:border-gray-700',
		elevated: 'bg-white border border-gray-900 dark:bg-gray-900 dark:border-gray-200',
		ghost: 'bg-transparent border-0 '
	};

	const sizeStyles = {
		sm: 'max-w-sm',
		md: 'max-w-md',
		lg: 'max-w-lg xl:max-w-xl'
	};

	const paddingStyles = {
		none: '',
		sm: 'p-3',
		md: 'p-4 sm:p-6',
		lg: 'p-6 sm:p-8'
	};

	// --- CÁLCULOS REACTIVOS CON $derived ---

	const interactiveClasses = $derived(
		interactive && !disabled
			? ' cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900'
			: ''
	);

	const disabledClasses = $derived(
		disabled ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''
	);

	// Combinamos todas las clases reactivamente
	const cardClasses = $derived(
		[
			baseClasses,
			variantStyles[variant],
			sizeStyles[size],
			paddingStyles[padding],
			interactiveClasses,
			disabledClasses,
			additionalClass
		]
			.filter(Boolean)
			.join(' ')
	);

	// Handler para clicks
	const handleClick = (event: MouseEvent | KeyboardEvent) => {
		if (disabled) return;
		onclick?.(event as Parameters<NonNullable<typeof onclick>>[0]);
	};
</script>

<!-- El tabindex 0 solo se aplica cuando `interactive` (y entonces el rol es "button") -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
	class={cardClasses}
	role={interactive ? 'button' : undefined}
	tabindex={interactive && !disabled ? 0 : -1}
	onclick={handleClick}
	onkeydown={(e) => {
		if (interactive && !disabled && (e.key === 'Enter' || e.key === ' ')) {
			e.preventDefault();
			handleClick(e);
		}
	}}
	{...restProps}
>
	{#if header}
		<div class="card-header mb-4 border-b border-gray-200 pb-4 dark:border-gray-700">
			{@render header()}
		</div>
	{/if}

	<div class="card-content">
		{@render children()}
	</div>

	{#if footer}
		<div class="card-footer mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
			{@render footer()}
		</div>
	{/if}
</div>
