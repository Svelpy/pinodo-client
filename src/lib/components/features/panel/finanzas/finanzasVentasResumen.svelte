<script lang="ts">
	import { StatTile } from '#lib/components/ui/index.ts';
	import { METODO_PAGO_LABEL } from '#lib/constants/index.ts';
	import { PackageIcon, TicketIcon, TredingUpIcon, XIcon } from '#lib/icons/outline/index.ts';
	import type { CobradoPorMetodo, ReporteVentasResumen } from '#lib/interfaces/index.ts';
	import { formatCurrency, formatDecimal, formatNumber, formatPercent } from '#lib/utils/index.ts';
	import FinanzasDesglose from './finanzasDesglose.svelte';

	/** Totales del reporte de ventas (solo confirmadas; las anuladas, aparte) */
	interface Props {
		/** null = cargando o sin datos */
		resumen: ReporteVentasResumen | null;
		cobrado: CobradoPorMetodo[] | null;
	}

	let { resumen, cobrado }: Props = $props();

	const moneda = (monto: number | undefined) => (monto === undefined ? '—' : formatCurrency(monto));
	const plural = (n: number, uno: string, varios: string) =>
		`${formatNumber(n)} ${n === 1 ? uno : varios}`;

	const desglose = $derived([
		{ label: 'Venta a precio normal', monto: resumen?.venta_precio_normal ?? 0 },
		{ label: 'Rebajas', monto: resumen?.rebajas ?? 0, resta: true },
		{ label: 'Descuentos por prenda', monto: resumen?.descuentos_prenda ?? 0, resta: true },
		{ label: 'Descuentos por venta', monto: resumen?.descuentos_venta ?? 0, resta: true }
	]);
</script>

<div class="space-y-3">
	<div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
		<StatTile
			label="Total vendido"
			value={moneda(resumen?.total_vendido)}
			caption={resumen ? plural(resumen.ventas, 'venta', 'ventas') : undefined}
			icon={TredingUpIcon}
			class="col-span-2 lg:col-span-1"
		/>
		<StatTile
			label="Ticket promedio"
			value={moneda(resumen?.ticket_promedio)}
			caption="Total vendido ÷ ventas"
			icon={TicketIcon}
		/>
		<StatTile
			label="Prendas vendidas"
			value={resumen ? formatNumber(resumen.unidades) : '—'}
			caption={resumen
				? `${formatDecimal(resumen.unidades_por_venta, { maximumFractionDigits: 1 })} por venta`
				: undefined}
			icon={PackageIcon}
		/>
		<StatTile
			label="Anuladas"
			value={moneda(resumen?.monto_anulado)}
			caption={resumen
				? `${plural(resumen.ventas_anuladas, 'venta', 'ventas')}, no suman al total`
				: undefined}
			icon={XIcon}
		/>
	</div>

	<div class="grid gap-3 lg:grid-cols-2">
		<FinanzasDesglose
			title="Del precio normal al total vendido"
			lineas={desglose}
			total={{ label: 'Total vendido', monto: resumen?.total_vendido ?? 0 }}
			cargando={!resumen}
		/>

		<section
			aria-label="Cobrado por método de pago"
			class="border border-light-one_d bg-light-one dark:border-dark-one_d dark:bg-dark-one"
		>
			<h3
				class="border-b border-light-one_d px-4 py-2.5 text-sm font-medium text-light-two_d dark:border-dark-one_d dark:text-dark-two_d"
			>
				Cobrado por método de pago
			</h3>
			{#if !cobrado}
				<div class="space-y-4 px-4 py-3" aria-hidden="true">
					{#each { length: 3 }, i (i)}
						<div class="space-y-2">
							<div class="h-4 w-32 animate-pulse bg-light-one_d dark:bg-dark-one_d"></div>
							<div class="h-1 w-full bg-light-one_d dark:bg-dark-one_d"></div>
						</div>
					{/each}
				</div>
			{:else if cobrado.length === 0}
				<p class="px-4 py-3 text-sm text-light-two_d dark:text-dark-two_d">
					Sin cobros en este periodo.
				</p>
			{:else}
				<ul class="divide-y divide-light-one_d dark:divide-dark-one_d">
					{#each cobrado as item (item.metodo)}
						<li class="px-4 py-3">
							<div class="flex items-baseline gap-2 text-sm">
								<span class="min-w-0 flex-1 truncate text-light-two dark:text-dark-two">
									{METODO_PAGO_LABEL[item.metodo] ?? item.metodo}
									<span class="text-xs text-light-two_d dark:text-dark-two_d">
										· {plural(item.pagos, 'pago', 'pagos')}
									</span>
								</span>
								<span class="text-xs text-light-two_d tabular-nums dark:text-dark-two_d">
									{formatPercent(item.porcentaje, { maximumFractionDigits: 0 })}
								</span>
								<span class="font-semibold text-light-two tabular-nums dark:text-dark-two">
									{formatCurrency(item.monto)}
								</span>
							</div>
							<div class="mt-2 h-1 bg-light-one_d dark:bg-dark-one_d">
								<div
									class="h-full bg-light-three dark:bg-dark-three"
									style:width="{Math.min(Math.max(item.porcentaje * 100, 1), 100)}%"
								></div>
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</section>
	</div>
</div>
