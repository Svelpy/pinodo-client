<script lang="ts">
	import type { Snippet } from 'svelte';
	import { AlertTriangleIcon } from '#lib/icons/outline/index.ts';
	import { cn } from '#lib/utils/index.ts';

	type AlertVariant = 'error' | 'warning' | 'info';

	interface Props {
		variant?: AlertVariant;
		children: Snippet;
		/** Acción a la derecha (p. ej. "Reintentar") */
		action?: Snippet;
		class?: string;
	}

	let { variant = 'error', children, action, class: className }: Props = $props();

	const variants: Record<AlertVariant, string> = {
		error:
			'border-light-error bg-light-error/10 text-light-error dark:border-dark-error dark:bg-dark-error/10 dark:text-dark-error',
		warning:
			'border-light-warning bg-light-warning/10 text-light-two dark:border-dark-warning dark:bg-dark-warning/10 dark:text-dark-two',
		info: 'border-light-accent bg-light-accent/10 text-light-two dark:border-dark-accent dark:bg-dark-accent/10 dark:text-dark-two'
	};
</script>

<!-- Aviso dentro de la página o de un formulario; los errores se anuncian a los lectores de pantalla -->
<div
	role={variant === 'error' ? 'alert' : 'status'}
	class={cn('flex items-start gap-2.5 border p-3 text-sm', variants[variant], className)}
>
	<AlertTriangleIcon class="mt-0.5 size-5 shrink-0" />
	<div class="min-w-0 flex-1">{@render children()}</div>
	{#if action}
		<div class="shrink-0">{@render action()}</div>
	{/if}
</div>
