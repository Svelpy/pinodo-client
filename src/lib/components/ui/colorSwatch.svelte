<script lang="ts">
	import { cn } from '#lib/utils/index.ts';

	interface Props {
		/** Código hexadecimal del color (p. ej. "#1E3A8A") */
		hex: string;
		class?: string;
	}

	let { hex, class: className }: Props = $props();
</script>

<!-- El color viene de los datos, por eso va en style y no en una clase de la paleta -->
<span
	class={cn(
		'inline-block size-8 shrink-0 border border-light-four dark:border-dark-four',
		className
	)}
	style:background-color={hex}
	aria-hidden="true"
></span>
