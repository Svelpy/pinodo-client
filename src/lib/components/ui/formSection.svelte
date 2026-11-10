<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '#lib/utils/index.ts';

	interface Props {
		title: string;
		description?: string;
		/** Acción a la derecha del título (p. ej. "Añadir red social" o "Cambiar contraseña") */
		action?: Snippet;
		children: Snippet;
		class?: string;
	}

	let { title, description, action, children, class: className }: Props = $props();

	const id = $props.id();
</script>

<section
	aria-labelledby="{id}-title"
	class={cn(
		'border border-light-one_d bg-light-one p-4 sm:p-6 dark:border-dark-one_d dark:bg-dark-one',
		className
	)}
>
	<div class="mb-5 flex flex-wrap items-start justify-between gap-3">
		<div class="min-w-0">
			<h2 id="{id}-title" class="text-base font-semibold text-light-two dark:text-dark-two">
				{title}
			</h2>
			{#if description}
				<p class="mt-1 text-sm text-light-two_d dark:text-dark-two_d">{description}</p>
			{/if}
		</div>
		{@render action?.()}
	</div>
	{@render children()}
</section>
