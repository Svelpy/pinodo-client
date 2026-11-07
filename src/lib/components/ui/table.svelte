<script lang="ts">
	import type { HTMLTableAttributes } from 'svelte/elements';
	import { cn } from '#lib/utils/index.ts';
	import type { Snippet } from 'svelte';

	interface Props extends HTMLTableAttributes {
		children: Snippet;
	}

	let { class: className, children, ...restProps }: Props = $props();
</script>

<table
	class={cn('w-full caption-bottom text-sm text-light-two dark:text-dark-two', className)}
	{...restProps}
>
	{@render children()}
</table>

<!-- <script lang="ts">
	import type { HTMLTableAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	//PROPS
	interface Props extends HTMLTableAttributes {
		class?: string;
		children: Snippet;
	}

	const { class: className, children, ...rest }: Props = $props();
</script>

<table
	{...rest}
	class="w-full table-fixed caption-bottom border-separate border-spacing-0 space-y-4 overflow-auto text-sm {className}"
>
	{@render children()}
</table> -->
