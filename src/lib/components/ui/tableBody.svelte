<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '#lib/utils/index.ts';
	import type { Snippet } from 'svelte';

	interface Props extends HTMLAttributes<HTMLTableSectionElement> {
		children: Snippet;
	}

	let { class: className, children, ...restProps }: Props = $props();
</script>

<tbody class={cn('[&_tr:last-child]:border-0', className)} {...restProps}>
	{@render children()}
</tbody>

<!-- 
<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	interface $$Props extends HTMLAttributes<HTMLTableSectionElement> {
		class?: string;
	}

	let className = '';
	export { className as class };
</script>

<tbody class="text-xs [&_tr:last-child]:border-0 {className}" {...$$restProps}>
	<slot />
</tbody> -->
