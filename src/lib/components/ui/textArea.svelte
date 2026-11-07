<script lang="ts">
	import { slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLTextareaAttributes, 'children'> {
		label?: string;
		error?: string;
		class?: string;
		value?: string | number | null | undefined;
	}

	let { class: className, label, error, value = $bindable(), ...restProps }: Props = $props();
</script>

<div class={className}>
	<label
		for={restProps.id}
		class="mb-1 grid grid-cols-[auto,_1fr] items-center gap-0.5 text-sm leading-6 font-medium text-light-black sm:text-base"
	>
		<span class="truncate"
			>{label} <span class="text-red-500">{restProps.required && '*'} </span></span
		>
	</label>
	<div class="relative">
		<textarea
			{...restProps}
			bind:value
			class="placeholder:text-light-five block w-full border bg-light-one px-4 py-2 text-sm {error
				? 'border-light-error focus:border-light-error'
				: 'border-light-four'} text-light-black transition-colors placeholder:text-xs hover:border-light-two focus:border-light-three focus:ring-0 sm:text-base sm:leading-6 placeholder:sm:text-sm"
		></textarea>

		{#if error}
			<p transition:slide={{ duration: 300, easing: cubicOut }} class="mt-1 text-sm text-red-500">
				{error}
			</p>
		{/if}
	</div>
</div>
