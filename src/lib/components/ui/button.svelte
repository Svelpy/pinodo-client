<script lang="ts">
	import { LoaderIcon } from '#lib/icons/outline/index.ts';
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes, HTMLAnchorAttributes } from 'svelte/elements';

	type ButtonVariant =
		'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'destructive' | 'link' | 'danger';
	type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

	interface Props {
		children?: Snippet;
		variant?: ButtonVariant;
		size?: ButtonSize;
		disabled?: boolean;
		loading?: boolean;
		fullWidth?: boolean;
		leftIcon?: Snippet;
		rightIcon?: Snippet;
		class?: string;
		href?: string;
		target?: HTMLAnchorAttributes['target'];
		rel?: HTMLAnchorAttributes['rel'];
		type?: HTMLButtonAttributes['type'];
		onclick?: (event: MouseEvent) => void;
		[key: string]: unknown;
	}

	let {
		children,
		variant = 'primary',
		size = 'md',
		disabled = false,
		loading = false,
		fullWidth = false,
		leftIcon,
		rightIcon,
		class: className = '',
		href,
		target,
		rel,
		type = 'button',
		onclick,
		...restProps
	}: Props = $props();

	const styles = {
		base: [
			'relative',
			'inline-flex items-center justify-center',
			'font-medium uppercase tracking-[0.08em] select-none',
			'transition-colors duration-200 ease-out',
			'focus:outline-none focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-light-two',
			'disabled:opacity-50 disabled:cursor-not-allowed',
			'touch-manipulation'
		].join(' '),

		variants: {
			primary:
				'bg-light-three text-light-one border border-light-three hover:bg-light-one hover:text-light-three active:bg-light-one_d',
			secondary:
				'bg-light-one border border-light-three text-light-three hover:bg-light-three hover:text-light-one active:bg-light-three_d',
			accent:
				'bg-light-accent text-light-one border border-light-accent hover:bg-light-accent_d active:bg-light-accent_d',
			outline:
				'bg-transparent text-light-two border border-light-four active:bg-light-one_d focus:ring-light-four_d',
			ghost:
				'bg-transparent text-light-two hover:bg-light-one_d active:bg-light-one_d focus:ring-light-four_d',
			destructive:
				'bg-light-error text-white border border-light-error hover:bg-white hover:text-light-error active:bg-light-one_d',
			danger:
				'bg-light-error text-white border border-light-error hover:bg-white hover:text-light-error active:bg-light-one_d',
			link: 'bg-transparent text-light-two p-0 hover:text-light-two_d hover:underline focus:ring-light-two_d underline-offset-4'
		},

		sizes: {
			xs: 'px-2 py-1 text-[10px] min-h-[32px] gap-1.5',
			sm: 'px-4 py-2 text-xs min-h-[36px] gap-2',
			md: 'px-6 py-2.5 text-xs min-h-[44px] gap-2',
			lg: 'px-8 py-3 text-sm min-h-[52px] gap-2.5',
			xl: 'px-10 py-4 text-sm min-h-[60px] gap-3'
		},

		iconSizes: {
			xs: 'p-1.5 text-xs min-h-[32px] ',
			sm: 'p-2 text-sm min-h-[36px] ',
			md: 'p-2.5 text-base min-h-[44px] ',
			lg: 'p-3 text-lg min-h-[52px] ',
			xl: 'p-4 text-xl min-h-[60px] '
		}
	} as const;

	const isLink = $derived(!!href);
	const isDisabled = $derived(disabled || loading);
	const isIconOnly = $derived(!children && (!!leftIcon || !!rightIcon));

	$effect(() => {
		if (isIconOnly && !restProps['aria-label']) {
			console.warn(
				`Accesibility Warning: An icon-only button should have an 'aria-label' prop to be accessible to screen readers.`
			);
		}
	});

	const buttonClasses = $derived(
		[
			styles.base,
			styles.variants[variant],
			isIconOnly ? styles.iconSizes[size] : styles.sizes[size],
			fullWidth && 'w-full',
			className
		]
			.filter(Boolean)
			.join(' ')
	);

	function handleClick(event: MouseEvent) {
		if (isDisabled) {
			event.preventDefault();
			event.stopPropagation();
			return;
		}
		onclick?.(event);
	}

	const commonProps = $derived({
		class: buttonClasses,
		'aria-disabled': isDisabled,
		'aria-busy': loading,
		tabindex: isDisabled ? -1 : undefined
	});
</script>

{#if isLink}
	<!-- `href` lo pasa quien usa el botón, que debe entregarlo ya resuelto con resolve() -->
	<!-- eslint-disable svelte/no-navigation-without-resolve -->
	<a
		{...commonProps}
		href={isDisabled ? undefined : href}
		{target}
		{rel}
		role="button"
		onclick={handleClick}
		{...restProps}
	>
		{@render buttonContent()}
	</a>
	<!-- eslint-enable svelte/no-navigation-without-resolve -->
{:else}
	<button {...commonProps} {type} disabled={isDisabled} onclick={handleClick} {...restProps}>
		{@render buttonContent()}
	</button>
{/if}

{#snippet buttonContent()}
	{#if loading}
		<span class="absolute inset-0 flex items-center justify-center" aria-label="Cargando...">
			<LoaderIcon class="h-5 w-5 animate-spin" />
		</span>
	{/if}

	{#if leftIcon}
		<span aria-hidden="true" class:invisible={loading}>
			{@render leftIcon()}
		</span>
	{/if}

	{#if children}
		<span class:invisible={loading}>
			{@render children()}
		</span>
	{/if}

	{#if rightIcon}
		<span aria-hidden="true" class:invisible={loading}>
			{@render rightIcon()}
		</span>
	{/if}
{/snippet}
