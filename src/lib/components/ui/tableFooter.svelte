<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '#lib/utils/index.ts';
	import type { Snippet } from 'svelte';

	interface Props extends HTMLAttributes<HTMLTableSectionElement> {
		children: Snippet;
	}

	let { class: className, children, ...restProps }: Props = $props();
</script>

<tfoot
	class={cn('bg-muted/50 border-t font-medium [&>tr]:last:border-b-0', className)}
	{...restProps}
>
	{@render children()}
</tfoot>
<!-- <script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	interface $$Props extends HTMLAttributes<HTMLTableSectionElement> {
		class?: string;
	}

	let className = '';
	export { className as class };
</script>

<tfoot class="bg-muted/50 border-t font-medium [&>tr]:last:border-b-0 {className}" {...$$restProps}>
	<slot />
</tfoot> -->
