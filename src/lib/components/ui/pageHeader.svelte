<script lang="ts">
	import type { Snippet } from 'svelte';
	import Heading from './heading.svelte';

	interface Props {
		title: string;
		description?: string;
		/** Botones de acción a la derecha (p. ej. "Nuevo vale") */
		actions?: Snippet;
	}

	let { title, description, actions }: Props = $props();
</script>

<div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
	<div class="min-w-0">
		<Heading level="h4" class="text-light-two dark:text-dark-two">{title}</Heading>
		{#if description}
			<p class="mt-1 text-sm text-light-two_d dark:text-dark-four">{description}</p>
		{/if}
	</div>
	{#if actions}
		<div class="flex shrink-0 flex-wrap gap-2">{@render actions()}</div>
	{/if}
</div>
