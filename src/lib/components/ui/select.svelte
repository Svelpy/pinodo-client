<script lang="ts">
	import { slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import type { Snippet } from 'svelte';
	import type { HTMLSelectAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLSelectAttributes, 'children'> {
		children: Snippet;
		icon?: Snippet;
		label?: string;
		error?: string;
		class?: string;
		value?: string | number | null | undefined;
	}

	let {
		class: className,
		children,
		icon,
		label,
		error,
		value = $bindable(),
		...restProps
	}: Props = $props();
</script>

<div class={className}>
	{#if label}
		<label
			class="relative mb-1 grid grid-cols-[auto,_1fr] items-center gap-0.5 text-sm leading-6 font-medium text-light-black sm:text-base"
			for={restProps.id}
			><span class="truncate"
				>{label} <span class="text-red-500">{restProps.required && '*'} </span></span
			>
		</label>
	{/if}
	<div class={icon && 'grid grid-cols-1'}>
		<select
			{...restProps}
			bind:value
			class="placeholder:text-light-five block w-full border border-light-four bg-light-one py-2 text-sm text-light-black transition-colors placeholder:text-xs hover:border-light-two focus:border-light-three focus:ring-0 disabled:cursor-not-allowed sm:text-base sm:leading-6 placeholder:sm:text-sm {icon &&
				'col-start-1 row-start-1 pl-10'}"
		>
			{@render children()}
		</select>
		{#if icon}
			<p class="pointer-events-none col-start-1 row-start-1 ml-3 self-center text-light-two_d">
				{@render icon()}
			</p>
		{/if}
		{#if error}
			<p transition:slide={{ duration: 300, easing: cubicOut }} class="mt-1 text-sm text-red-500">
				{error}
			</p>
		{/if}
	</div>
</div>
