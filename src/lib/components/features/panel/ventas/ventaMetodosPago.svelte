<script lang="ts">
	import { METODO_PAGO_LABEL, type MetodoPago } from '#lib/constants/index.ts';
	import { formatValue, metodosPagoTexto } from '#lib/utils/index.ts';
	import { METODO_PAGO_ICON } from './ventaIcons.ts';

	/** Métodos con que se pagó una venta: icono y nombre; con varios, uno tras otro */
	interface Props {
		metodos: readonly MetodoPago[];
		class?: string;
	}

	let { metodos, class: className = '' }: Props = $props();
</script>

{#if metodos.length === 0}
	<span class="text-light-two_d dark:text-dark-two_d {className}">{formatValue(null)}</span>
{:else}
	<span
		class="inline-flex max-w-full flex-wrap items-center gap-x-2.5 gap-y-0.5 text-light-two dark:text-dark-two {className}"
		title={metodosPagoTexto(metodos)}
	>
		{#each metodos as metodo (metodo)}
			{@const Icon = METODO_PAGO_ICON[metodo]}
			<span class="inline-flex min-w-0 items-center gap-1">
				<Icon class="size-4 shrink-0 text-light-two_d dark:text-dark-two_d" />
				<span class="truncate">{METODO_PAGO_LABEL[metodo]}</span>
			</span>
		{/each}
	</span>
{/if}
