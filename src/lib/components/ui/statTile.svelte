<script lang="ts">
	import type { Component } from 'svelte';
	import { cn } from '#lib/utils/index.ts';

	interface Props {
		/** Qué mide, en frase corta (sin dos puntos) */
		label: string;
		/** Valor ya formateado (formatNumber, formatCurrency…) */
		value: string;
		/** Contexto debajo del valor (p. ej. "12 hoy") */
		caption?: string;
		icon?: Component<{ class?: string }>;
		class?: string;
	}

	let { label, value, caption, icon: Icon, class: className }: Props = $props();
</script>

<!-- Tarjeta de un indicador: etiqueta, valor y contexto. Para filas de KPIs en paneles de inicio -->
<div
	class={cn(
		'flex flex-col gap-3  border border-light-one_d bg-light-one p-4 dark:border-dark-one_d dark:bg-dark-one',
		className
	)}
>
	<p class="flex items-center gap-2 text-sm font-medium text-light-two_d dark:text-dark-two_d">
		{#if Icon}
			<span
				class="flex size-8 shrink-0 items-center justify-center bg-light-one_d text-light-three dark:bg-dark-one_d dark:text-dark-three"
			>
				<Icon class="size-4" />
			</span>
		{/if}
		<span class="min-w-0">{label}</span>
	</p>
	<div class="min-w-0">
		<p class="truncate text-2xl font-semibold text-light-two dark:text-dark-two" title={value}>
			{value}
		</p>
		{#if caption}
			<p class="mt-0.5 text-xs text-light-two_d dark:text-dark-two_d">{caption}</p>
		{/if}
	</div>
</div>
