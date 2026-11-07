<script lang="ts">
	import { slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import type { Component, Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { cn } from '#lib/utils/cn.ts';

	type InputSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
	interface Props extends Omit<HTMLInputAttributes, 'size'> {
		icon?: Component;
		// Contenido al final del input (p. ej. botón para mostrar contraseña)
		trailing?: Snippet;
		label?: string;
		error?: string;
		size?: InputSize;
		value?: string | number | null | undefined;
	}

	let {
		class: className,
		icon,
		trailing,
		label,
		error,
		size = 'md',
		value = $bindable(),
		...restProps
	}: Props = $props();

	const sizeStyles: Record<InputSize, string> = {
		xs: 'h-8 px-2.5 text-xs',
		sm: 'h-10 px-3 text-sm',
		md: 'h-11 px-4 text-sm sm:text-base',
		lg: 'h-13 px-4 text-base sm:text-lg',
		xl: 'h-15 px-5 text-lg sm:text-xl'
	};
</script>

<div class={className}>
	<label
		for={restProps.id}
		class="grid grid-cols-[auto,_1fr] items-center gap-0.5 text-sm leading-6 font-medium text-light-black sm:text-base"
	>
		<span class="truncate"
			>{label} <span class="text-red-500">{restProps.required && '*'} </span></span
		>
	</label>
	<div class="relative {label && 'mt-1'}  {(icon || trailing) && 'grid grid-cols-1'}">
		<input
			{...restProps}
			bind:value
			class={cn(
				'placeholder:text-light-five block w-full border border-light-four bg-light-one text-light-black transition-colors outline-none hover:border-light-two focus:border-light-three focus:ring-0',
				sizeStyles[size],
				// Con icono o contenido final el contenedor es una grilla: el input comparte celda con ellos
				(icon || trailing) && 'col-start-1 row-start-1',
				icon && 'pl-10',
				trailing && 'pr-11',
				error && 'border-light-error focus:border-light-error',
				'placeholder:text-xs placeholder:sm:text-sm'
			)}
		/>
		{#if icon}
			<p
				class="pointer-events-none absolute col-start-1 row-start-1 ml-3 self-center text-light-two_d"
			>
				{#await Promise.resolve(icon) then Icon}
					<Icon />
				{/await}
			</p>
		{/if}
		{#if trailing}
			<div class="col-start-1 row-start-1 mr-1.5 flex self-center justify-self-end">
				{@render trailing()}
			</div>
		{/if}
		{#if error}
			<p transition:slide={{ duration: 300, easing: cubicOut }} class="mt-1 text-sm text-red-500">
				{error}
			</p>
		{/if}
	</div>
</div>
