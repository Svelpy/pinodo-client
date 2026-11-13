<script lang="ts">
	import {
		StatTile,
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '#lib/components/ui/index.ts';
	import { ROLE_LABEL } from '#lib/constants/index.ts';
	import { FileDescriptionIcon, PackageIcon, WalletIcon } from '#lib/icons/outline/index.ts';
	import type { AjusteInventarioDetalle } from '#lib/interfaces/index.ts';
	import {
		formatCurrency,
		formatDateTime,
		formatFullName,
		formatNumber,
		formatSignedNumber,
		formatValue,
		varianteSku
	} from '#lib/utils/index.ts';
	import KardexAjusteMotivoBadge from './kardexAjusteMotivoBadge.svelte';
	import KardexCantidad from './kardexCantidad.svelte';
	import KardexSku from './kardexSku.svelte';
	import KardexSkuLink from './kardexSkuLink.svelte';

	/** Documento de ajuste con sus líneas (los movimientos del kardex que registró) */
	interface Props {
		ajuste: AjusteInventarioDetalle;
	}

	let { ajuste }: Props = $props();

	// La lista no trae el nombre de quien lo registró; cada línea sí trae su responsable
	const responsable = $derived(ajuste.movimientos[0]?.usuario ?? null);

	const headClass = 'h-11 text-xs tracking-wide text-light-two_d uppercase dark:text-dark-two_d';
	const money = 'px-4 py-3 text-right text-sm whitespace-nowrap tabular-nums';
	const dtClass = 'text-xs font-medium text-light-two_d dark:text-dark-two_d';
	const ddClass = 'mt-0.5 text-sm text-light-two dark:text-dark-two';
	const card = 'border border-light-one_d bg-light-one dark:border-dark-one_d dark:bg-dark-one';
</script>

<div class="space-y-4">
	<div class="grid grid-cols-2 gap-3 md:grid-cols-3">
		<StatTile
			label="SKUs"
			value={formatNumber(ajuste.items)}
			caption="Prendas distintas que movió"
			icon={PackageIcon}
		/>
		<StatTile
			label="Unidades"
			value={formatSignedNumber(ajuste.unidades)}
			caption="Positivo entra, negativo sale"
			icon={FileDescriptionIcon}
		/>
		<StatTile
			label="Valor"
			value={formatCurrency(ajuste.valor)}
			caption="Cantidad × costo unitario"
			icon={WalletIcon}
			class="col-span-2 md:col-span-1"
		/>
	</div>

	<section aria-label="Datos del ajuste" class="{card} p-4">
		<dl class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			<div>
				<dt class={dtClass}>Motivo</dt>
				<dd class="mt-1"><KardexAjusteMotivoBadge motivo={ajuste.motivo} /></dd>
			</div>
			<div>
				<dt class={dtClass}>Fecha</dt>
				<dd class={ddClass}>{formatDateTime(ajuste.created_at)}</dd>
			</div>
			<div>
				<dt class={dtClass}>Registrado por</dt>
				<dd class={ddClass}>
					{#if ajuste.created_by === null}
						Sistema
					{:else if responsable}
						{formatFullName(responsable)}
						<span class="text-xs text-light-two_d dark:text-dark-two_d">
							· {ROLE_LABEL[responsable.rol]}
						</span>
					{:else}
						{formatValue(null)}
					{/if}
				</dd>
			</div>
			<div class="sm:col-span-2 lg:col-span-1">
				<dt class={dtClass}>Nota</dt>
				<dd class="{ddClass} wrap-break-word">{formatValue(ajuste.nota)}</dd>
			</div>
		</dl>
	</section>

	<section aria-labelledby="ajuste-lineas" class={card}>
		<h3
			id="ajuste-lineas"
			class="border-b border-light-one_d px-4 py-2.5 text-sm font-medium text-light-two_d dark:border-dark-one_d dark:text-dark-two_d"
		>
			Líneas ({formatNumber(ajuste.movimientos.length)})
		</h3>

		{#if ajuste.movimientos.length === 0}
			<p class="px-4 py-3 text-sm text-light-two_d dark:text-dark-two_d">
				Este ajuste no tiene líneas.
			</p>
		{:else}
			<!-- Móvil: una fila por prenda -->
			<ul class="divide-y divide-light-one_d md:hidden dark:divide-dark-one_d">
				{#each ajuste.movimientos as movimiento (movimiento.id)}
					<li class="flex items-start gap-3 px-4 py-3">
						<div class="min-w-0 flex-1">
							<KardexSku sku={movimiento.sku} mostrarCodigo class="text-sm" />
							<p class="mt-1 text-xs text-light-two_d tabular-nums dark:text-dark-two_d">
								{formatCurrency(movimiento.costo_unitario)} c/u · saldo {formatNumber(
									movimiento.saldo
								)}
							</p>
						</div>
						<div class="shrink-0 text-right">
							<KardexCantidad cantidad={movimiento.cantidad} />
							<p class="text-xs text-light-two_d tabular-nums dark:text-dark-two_d">
								{formatCurrency(movimiento.costo_total)}
							</p>
						</div>
						<KardexSkuLink
							skuId={movimiento.sku.id}
							nombre="{movimiento.sku.producto_nombre}, {varianteSku(movimiento.sku)}"
							class="-mt-1.5 -mr-2 shrink-0"
						/>
					</li>
				{/each}
			</ul>

			<!-- Tablet y escritorio: tabla -->
			<div class="relative hidden overflow-x-auto md:block">
				<Table class="table-fixed text-sm">
					<TableHeader>
						<TableRow class="border-light-one_d hover:bg-transparent dark:border-dark-one_d">
							<TableHead class={headClass}>Producto</TableHead>
							<TableHead class="{headClass} w-24 text-right">Cantidad</TableHead>
							<TableHead class="{headClass} w-32 text-right">Costo unit.</TableHead>
							<TableHead class="{headClass} w-32 text-right">Costo total</TableHead>
							<TableHead
								class="{headClass} hidden w-20 text-right lg:table-cell"
								title="Stock del SKU tras el ajuste"
							>
								Saldo
							</TableHead>
							<TableHead class="{headClass} hidden w-32 text-right xl:table-cell">
								Costo prom.
							</TableHead>
							<TableHead class="h-11 w-14 px-2"><span class="sr-only">Kardex</span></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{#each ajuste.movimientos as movimiento (movimiento.id)}
							<TableRow class="border-light-one_d hover:bg-transparent dark:border-dark-one_d">
								<TableCell class="px-4 py-3 text-sm">
									<KardexSku sku={movimiento.sku} mostrarCodigo />
								</TableCell>
								<TableCell class="px-4 py-3 text-right text-sm">
									<KardexCantidad cantidad={movimiento.cantidad} />
								</TableCell>
								<TableCell class="{money} text-light-two_d dark:text-dark-two_d">
									{formatCurrency(movimiento.costo_unitario)}
								</TableCell>
								<TableCell class="{money} font-semibold text-light-two dark:text-dark-two">
									{formatCurrency(movimiento.costo_total)}
								</TableCell>
								<TableCell class="{money} hidden text-light-two lg:table-cell dark:text-dark-two">
									{formatNumber(movimiento.saldo)}
								</TableCell>
								<TableCell
									class="{money} hidden text-light-two_d xl:table-cell dark:text-dark-two_d"
								>
									{formatCurrency(movimiento.costo_promedio)}
								</TableCell>
								<TableCell class="px-2 py-3 text-right">
									<KardexSkuLink
										skuId={movimiento.sku.id}
										nombre="{movimiento.sku.producto_nombre}, {varianteSku(movimiento.sku)}"
									/>
								</TableCell>
							</TableRow>
						{/each}
					</TableBody>
				</Table>
			</div>
		{/if}
	</section>
</div>
