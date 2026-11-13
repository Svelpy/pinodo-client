<script lang="ts">
	import { AlertBox, StatTile } from '#lib/components/ui/index.ts';
	import { PercentIcon, TagIcon, TredingUpIcon, WalletIcon } from '#lib/icons/outline/index.ts';
	import type { RentabilidadResumen } from '#lib/interfaces/index.ts';
	import { formatCurrency, formatNumber, formatPercent } from '#lib/utils/index.ts';
	import FinanzasDesglose from './finanzasDesglose.svelte';

	/** Totales del reporte de rentabilidad: ingreso, costo y margen bruto de lo vendido */
	interface Props {
		/** null = cargando o sin datos */
		resumen: RentabilidadResumen | null;
	}

	let { resumen }: Props = $props();

	const moneda = (monto: number | undefined) => (monto === undefined ? '—' : formatCurrency(monto));
	const prendas = (n: number) => `${formatNumber(n)} ${n === 1 ? 'prenda' : 'prendas'}`;

	const desglose = $derived([
		{ label: 'Venta a precio normal', monto: resumen?.venta_precio_normal ?? 0 },
		{ label: 'Rebajas y descuentos', monto: resumen?.descuentos ?? 0, resta: true },
		{ label: 'Costo de lo vendido', monto: resumen?.costo ?? 0, resta: true }
	]);
</script>

<div class="space-y-3">
	{#if resumen && resumen.unidades_sin_costo > 0}
		<AlertBox variant="warning">
			{prendas(resumen.unidades_sin_costo)} vendidas no tienen costo registrado, así que el margen sale
			más alto de lo real. Corrige el costo editando el SKU.
		</AlertBox>
	{/if}

	<div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
		<StatTile
			label="Ingreso neto"
			value={moneda(resumen?.ingreso_neto)}
			caption={resumen ? prendas(resumen.unidades) : undefined}
			icon={WalletIcon}
		/>
		<StatTile
			label="Costo"
			value={moneda(resumen?.costo)}
			caption="Costo promedio de lo vendido"
			icon={TagIcon}
		/>
		<StatTile
			label="Margen bruto"
			value={moneda(resumen?.margen_bruto)}
			caption="Ingreso neto − costo"
			icon={TredingUpIcon}
		/>
		<StatTile
			label="Margen"
			value={resumen ? formatPercent(resumen.margen_porcentaje) : '—'}
			caption="Sobre el ingreso neto"
			icon={PercentIcon}
		/>
	</div>

	<FinanzasDesglose
		title="Del precio normal al margen bruto"
		lineas={desglose}
		total={{ label: 'Margen bruto', monto: resumen?.margen_bruto ?? 0 }}
		cargando={!resumen}
	/>
</div>
