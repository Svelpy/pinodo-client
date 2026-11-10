<script lang="ts">
	import { StatTile } from '#lib/components/ui/index.ts';
	import {
		CheckCircleIcon,
		CreditCardIcon,
		ScanBarcodeIcon,
		StopwatchIcon,
		WalletIcon,
		XIcon
	} from '#lib/icons/outline/index.ts';
	import type { VentaResumen } from '#lib/interfaces/index.ts';
	import { formatCurrency } from '#lib/utils/index.ts';

	/**
	 * Totales de todas las ventas del rango y canal elegidos (no solo de la página). La API ignora los
	 * filtros de estado y método de pago para el resumen, así que siempre muestra el desglose completo.
	 */
	interface Props {
		resumen: VentaResumen | null;
		/** Texto del periodo, p. ej. "Hoy" */
		periodo: string;
	}

	let { resumen, periodo }: Props = $props();

	const valor = (monto: number | undefined) =>
		resumen && monto !== undefined ? formatCurrency(monto) : '—';
</script>

<section aria-label="Resumen de caja · {periodo}" class="space-y-3">
	<div class="grid grid-cols-2 gap-3 md:grid-cols-4">
		<StatTile
			label="Cobrado"
			value={valor(resumen?.confirmada.total)}
			caption={periodo}
			icon={CheckCircleIcon}
			class="col-span-2 md:col-span-1"
		/>
		<StatTile label="Efectivo" value={valor(resumen?.confirmada.efectivo)} icon={WalletIcon} />
		<StatTile label="QR" value={valor(resumen?.confirmada.qr)} icon={ScanBarcodeIcon} />
		<StatTile
			label="Transferencia"
			value={valor(resumen?.confirmada.transferencia)}
			icon={CreditCardIcon}
		/>
	</div>
	<div class="grid grid-cols-2 gap-3">
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
</section>
