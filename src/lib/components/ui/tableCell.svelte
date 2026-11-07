<script lang="ts">
	import type { HTMLTdAttributes } from 'svelte/elements';
	import { cn } from '#lib/utils/index.ts';
	import type { Snippet } from 'svelte';

	interface Props extends HTMLTdAttributes {
		children: Snippet;
	}

	let { class: className, children, ...restProps }: Props = $props();
</script>

<td class={cn('p-4 align-middle', className)} {...restProps}>
	{@render children()}
</td>

<!-- <script lang="ts">
	import type { HTMLTdAttributes } from 'svelte/elements';

	interface $$Props extends HTMLTdAttributes {
		class?: string;
	}

	let className = '';
	export { className as class };
</script>

<td
	class="border-b p-4 align-middle [&:has([role=checkbox])]:pr-0 [:last-child_>_&]:border-b-0 {className}"
	{...$$restProps}
>
	<slot />
</td> -->
