<script lang="ts">
	import type { TiendaPrecios } from '#lib/interfaces/index.ts';
	import { cn, formatCurrency, formatPriceRange } from '#lib/utils/index.ts';

	interface Props {
		precios: Pick<
			TiendaPrecios,
			'precio_desde' | 'precio_hasta' | 'precio_normal_desde' | 'precio_normal_hasta' | 'en_rebaja'
		>;
		/** Listados: solo el precio "desde" (con "Desde" si hay varios precios) */
		compacto?: boolean;
		class?: string;
	}

	let { precios, compacto = false, class: className }: Props = $props();

	const variable = $derived(precios.precio_desde !== precios.precio_hasta);
	const actual = $derived(
		compacto
			? formatCurrency(precios.precio_desde)
			: formatPriceRange(precios.precio_desde, precios.precio_hasta)
	);
	const normal = $derived(
		compacto
			? formatCurrency(precios.precio_normal_desde)
			: formatPriceRange(precios.precio_normal_desde, precios.precio_normal_hasta)
	);
	const rebaja = $derived(precios.en_rebaja && normal !== actual);
	const descuento = $derived(
		rebaja && precios.precio_normal_desde > 0
			? Math.round((1 - precios.precio_desde / precios.precio_normal_desde) * 100)
			: 0
	);
</script>

<p class={cn('flex flex-wrap items-baseline gap-x-2', className)}>
	{#if compacto && variable}
		<span>Desde</span>
	{/if}
	{#if rebaja}
		<span class="sr-only">Precio anterior:</span>
		<s class="text-light-two_d dark:text-dark-two_d">{normal}</s>
		<span class="sr-only">Precio actual:</span>
		<span class="text-light-error dark:text-dark-error">{actual}</span>
		{#if descuento > 0}
			<span class="text-light-error dark:text-dark-error">-{descuento}%</span>
		{/if}
	{:else}
		<span>{actual}</span>
	{/if}
</p>
