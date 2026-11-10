<script lang="ts">
	import type { ProductoResumen } from '#lib/interfaces/index.ts';
	import { cn, formatCurrency } from '#lib/utils/index.ts';

	interface Props {
		resumen: Pick<
			ProductoResumen,
			'precio_desde' | 'precio_hasta' | 'precio_normal_desde' | 'precio_normal_hasta' | 'en_rebaja'
		>;
		class?: string;
	}

	let { resumen, class: className }: Props = $props();

	/** Extremos distintos de un rango, de menor a mayor (uno solo si coinciden) */
	function extremos(desde: number | null, hasta: number | null): number[] {
		if (desde == null || hasta == null) return [desde ?? hasta].filter((v) => v != null);
		return desde === hasta ? [desde] : [desde, hasta];
	}

	const vigentes = $derived(extremos(resumen.precio_desde, resumen.precio_hasta));
	const normales = $derived(extremos(resumen.precio_normal_desde, resumen.precio_normal_hasta));
	// Sin precios normales o iguales a los vigentes: no hay nada que comparar
	const rebaja = $derived(
		resumen.en_rebaja && normales.length > 0 && normales.join() !== vigentes.join()
	);

	const label = 'w-14 shrink-0 text-[0.65rem] tracking-wide uppercase';
</script>

<!-- Cada precio en su propia línea, con una etiqueta que dice qué es -->
<div class={cn('flex flex-col gap-1 text-sm whitespace-nowrap tabular-nums', className)}>
	{#if vigentes.length === 0}
		<span class="text-light-two_d dark:text-dark-two_d">{formatCurrency(null)}</span>
	{:else if rebaja}
		<div class="flex items-baseline gap-2 text-light-two_d dark:text-dark-two_d">
			<span class={label}>Normal</span>
			<s class="flex flex-col text-xs">
				{#each normales as precio (precio)}
					<span>{formatCurrency(precio)}</span>
				{/each}
			</s>
		</div>
		<div class="flex items-baseline gap-2 text-light-error dark:text-dark-error">
			<span class={label}>Rebaja</span>
			<span class="flex flex-col font-semibold">
				{#each vigentes as precio (precio)}
					<span>{formatCurrency(precio)}</span>
				{/each}
			</span>
		</div>
	{:else if vigentes.length === 2}
		{#each vigentes as precio, i (precio)}
			<div class="flex items-baseline gap-2">
				<span class="{label} text-light-two_d dark:text-dark-two_d">
					{i === 0 ? 'Desde' : 'Hasta'}
				</span>
				<span class="font-medium text-light-two dark:text-dark-two">{formatCurrency(precio)}</span>
			</div>
		{/each}
	{:else}
		<span class="font-medium text-light-two dark:text-dark-two">
			{formatCurrency(vigentes[0])}
		</span>
	{/if}
</div>
