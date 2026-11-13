<script lang="ts">
	import { StatTile } from '#lib/components/ui/index.ts';
	import { METODO_PAGO_LABEL } from '#lib/constants/index.ts';
	import { CheckCircleIcon, StopwatchIcon, XIcon } from '#lib/icons/outline/index.ts';
	import type { VentaResumen } from '#lib/interfaces/index.ts';
	import { desgloseCobrado, formatCurrency } from '#lib/utils/index.ts';
	import { METODO_PAGO_ICON } from './ventaIcons.ts';

	/**
	 * Totales de todas las ventas del rango, canal, vendedor y número elegidos (no solo de la página).
	 * La API ignora los filtros de estado y método de pago para el resumen, así que siempre muestra el
	 * desglose completo.
	 */
	interface Props {
		resumen: VentaResumen | null;
		/** Texto del periodo, p. ej. "Hoy" */
		periodo: string;
	}

	let { resumen, periodo }: Props = $props();

	const valor = (monto: number | undefined) =>
		resumen && monto !== undefined ? formatCurrency(monto) : '—';

	const desglose = $derived(resumen ? desgloseCobrado(resumen.confirmada) : []);
	const formatParte = (parte: number) =>
		parte > 0 && parte < 0.01 ? '<1 %' : `${Math.round(parte * 100)} %`;
</script>

<section aria-label="Resumen de caja · {periodo}" class="space-y-3">
	<div class="grid grid-cols-2 gap-3 md:grid-cols-3">
		<StatTile
			label="Cobrado"
			value={valor(resumen?.confirmada.total)}
			caption={periodo}
			icon={CheckCircleIcon}
			class="col-span-2 md:col-span-1"
		/>
		<StatTile
			label="Pedidos por cobrar"
			value={valor(resumen?.pendiente)}
			caption="Pendientes, aún sin descontar stock"
			icon={StopwatchIcon}
		/>
		<StatTile
			label="Canceladas"
			value={valor(resumen?.cancelada)}
			caption="Pedidos y ventas anuladas"
			icon={XIcon}
		/>
	</div>

	<div class="border border-light-one_d bg-light-one dark:border-dark-one_d dark:bg-dark-one">
		<h3
			class="border-b border-light-one_d px-4 py-2.5 text-sm font-medium text-light-two_d dark:border-dark-one_d dark:text-dark-two_d"
		>
			Cobrado por método de pago
		</h3>
		{#if !resumen}
			<!-- Cargando: mismo alto que una fila del desglose -->
			<div class="grid gap-px sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
				{#each [0, 1, 2, 3] as index (index)}
					<div class="space-y-2 px-4 py-3">
						<div class="h-4 w-24 animate-pulse bg-light-one_d dark:bg-dark-one_d"></div>
						<div class="h-1 w-full bg-light-one_d dark:bg-dark-one_d"></div>
					</div>
				{/each}
			</div>
		{:else if desglose.length === 0}
			<p class="px-4 py-3 text-sm text-light-two_d dark:text-dark-two_d">
				Sin cobros en este periodo.
			</p>
		{:else}
			<ul
				class="grid divide-y divide-light-one_d sm:grid-cols-2 sm:divide-y-0 xl:grid-cols-4 dark:divide-dark-one_d"
			>
				{#each desglose as item (item.metodo)}
					{@const Icon = METODO_PAGO_ICON[item.metodo]}
					<li class="px-4 py-3">
						<div class="flex items-center gap-2 text-sm">
							<Icon class="size-4 shrink-0 text-light-three dark:text-dark-three" />
							<span class="min-w-0 flex-1 truncate text-light-two dark:text-dark-two">
								{METODO_PAGO_LABEL[item.metodo]}
							</span>
							<span class="text-xs text-light-two_d tabular-nums dark:text-dark-two_d">
								{formatParte(item.parte)}
							</span>
							<span class="font-semibold text-light-two tabular-nums dark:text-dark-two">
								{formatCurrency(item.monto)}
							</span>
						</div>
						<div class="mt-2 h-1 bg-light-one_d dark:bg-dark-one_d">
							<div
								class="h-full bg-light-three dark:bg-dark-three"
								style:width="{Math.max(item.parte * 100, 1)}%"
							></div>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>
