<script lang="ts">
	import { StatTile } from '#lib/components/ui/index.ts';
	import { ROLE_LABEL } from '#lib/constants/index.ts';
	import type { MovimientoInventario } from '#lib/interfaces/index.ts';
	import {
		formatCurrency,
		formatDateTime,
		formatFullName,
		formatNumber,
		formatSignedNumber
	} from '#lib/utils/index.ts';
	import KardexOrigen from './kardexOrigen.svelte';
	import KardexSku from './kardexSku.svelte';
	import KardexTipoBadge from './kardexTipoBadge.svelte';

	/** Un movimiento del kardex valorizado. No se edita: un error se corrige con otro ajuste */
	interface Props {
		movimiento: MovimientoInventario;
	}

	let { movimiento }: Props = $props();

	const sale = $derived(movimiento.cantidad < 0);

	const dtClass = 'text-xs font-medium text-light-two_d dark:text-dark-two_d';
	const ddClass = 'mt-0.5 text-sm text-light-two dark:text-dark-two';
	const card = 'border border-light-one_d bg-light-one dark:border-dark-one_d dark:bg-dark-one';
</script>

<div class="space-y-4">
	<section aria-label="Prenda" class="{card} flex items-start justify-between gap-3 p-4">
		<KardexSku sku={movimiento.sku} mostrarCodigo />
		<KardexTipoBadge tipo={movimiento.tipo} />
	</section>

	<!-- Kardex valorizado: lo que movió y cómo quedó el SKU después -->
	<section aria-label="Valores del movimiento" class="grid grid-cols-2 gap-3 md:grid-cols-3">
		<StatTile
			label="Cantidad"
			value={formatSignedNumber(movimiento.cantidad)}
			caption={sale ? 'Unidades que salieron' : 'Unidades que entraron'}
		/>
		<StatTile
			label="Costo unitario"
			value={formatCurrency(movimiento.costo_unitario)}
			caption="Por unidad movida"
		/>
		<StatTile
			label="Costo total"
			value={formatCurrency(movimiento.costo_total)}
			caption="Cantidad × costo unitario"
		/>
		<StatTile
			label="Saldo"
			value={formatNumber(movimiento.saldo)}
			caption="Stock que dejó el movimiento"
		/>
		<StatTile
			label="Costo promedio"
			value={formatCurrency(movimiento.costo_promedio)}
			caption="Del SKU después del movimiento"
		/>
		<StatTile
			label="Valor del saldo"
			value={formatCurrency(movimiento.saldo_valor)}
			caption="Saldo × costo promedio"
		/>
	</section>

	<section aria-label="Origen del movimiento" class="{card} p-4">
		<dl class="grid gap-4 sm:grid-cols-3">
			<div>
				<dt class={dtClass}>Documento</dt>
				<dd class={ddClass}><KardexOrigen origen={movimiento.origen} enlace /></dd>
			</div>
			<div>
				<dt class={dtClass}>Responsable</dt>
				<dd class={ddClass}>
					{formatFullName(movimiento.usuario)}
					<span class="text-xs text-light-two_d dark:text-dark-two_d">
						· {ROLE_LABEL[movimiento.usuario.rol]}
					</span>
				</dd>
			</div>
			<div>
				<dt class={dtClass}>Fecha</dt>
				<dd class={ddClass}>{formatDateTime(movimiento.created_at)}</dd>
			</div>
		</dl>
	</section>
</div>
