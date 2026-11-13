<script lang="ts">
	import { cn } from '#lib/utils/index.ts';

	/** Prenda de una línea de reporte: producto, variante y (opcional) código de barras */
	interface Props {
		producto: string;
		color: string;
		talla: string;
		codigoBarras?: string | null;
		class?: string;
	}

	let { producto, color, talla, codigoBarras = null, class: className }: Props = $props();
</script>

<div class={cn('min-w-0', className)}>
	<p class="truncate font-medium text-light-two dark:text-dark-two" title={producto}>
		{producto}
	</p>
	<p class="truncate text-xs text-light-two_d dark:text-dark-two_d">
		{color} · {talla}{#if codigoBarras}<span class="tabular-nums"> · {codigoBarras}</span>{/if}
	</p>
</div>
