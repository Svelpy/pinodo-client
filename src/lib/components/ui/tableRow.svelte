<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '#lib/utils/index.ts';
	import type { Snippet } from 'svelte';

	interface Props extends HTMLAttributes<HTMLTableRowElement> {
		children: Snippet;
	}

	let { class: className, children, ...restProps }: Props = $props();
</script>

<tr
	class={cn(
		'border-b border-light-one_d transition-colors hover:bg-light-one_d/50 dark:border-dark-one_d dark:hover:bg-dark-one/50',
		className
	)}
	{...restProps}
>
	{@render children()}
</tr>

<!-- <script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	interface $$Props extends HTMLAttributes<HTMLTableRowElement> {
		class?: string;
	}

	let className = '';
	export { className as class };
</script>

<tr
	class="hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors {className}"
	{...$$restProps}
>
	<slot />
</tr> -->
