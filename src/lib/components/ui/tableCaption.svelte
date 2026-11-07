<script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '#lib/utils/index.ts';
	import type { Snippet } from 'svelte';

	interface Props extends HTMLAttributes<HTMLElement> {
		children?: Snippet;
	}

	let { class: className, children, ...restProps }: Props = $props();
</script>

<caption class={cn('text-muted-foreground mt-4 text-sm', className)} {...restProps}>
	{#if children}
		{@render children()}
	{/if}
</caption>

<!-- <script lang="ts">
	import type { HTMLAttributes } from 'svelte/elements';

	interface $$Props extends HTMLAttributes<HTMLTableCaptionElement> {
		class?: string;
	}

	let className = '';
	export { className as class };
</script>

<caption class="text-muted foreground mt-4 text-sm {className}" {...$$restProps}>
	<slot />
</caption> -->
