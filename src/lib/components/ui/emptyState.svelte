<script lang="ts">
	import type { Component, Snippet } from 'svelte';
	import { cn } from '#lib/utils/index.ts';

	interface Props {
		title: string;
		description?: string;
		icon?: Component<{ class?: string }>;
		/** Acción sugerida (p. ej. un botón "Nuevo usuario") */
		children?: Snippet;
		class?: string;
	}

	let { title, description, icon: Icon, children, class: className }: Props = $props();
</script>

<div class={cn('flex flex-col items-center gap-3 px-4 py-12 text-center', className)}>
	{#if Icon}
		<span
			class="flex size-12 items-center justify-center bg-light-one_d text-light-three dark:bg-dark-one_d dark:text-dark-three"
		>
			<Icon class="size-6" />
		</span>
	{/if}
	<div class="max-w-sm">
		<p class="text-base font-semibold text-light-two dark:text-dark-two">{title}</p>
		{#if description}
			<p class="mt-1 text-sm text-light-two_d dark:text-dark-two_d">{description}</p>
		{/if}
	</div>
	{#if children}
		<div class="mt-1">
			{@render children()}
		</div>
	{/if}
</div>
