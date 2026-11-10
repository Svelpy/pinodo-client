<script lang="ts">
	import { untrack } from 'svelte';
	import { AlertBox, Button, SegmentedControl, Sheet } from '#lib/components/ui/index.ts';
	import {
		METODO_PAGO,
		METODO_PAGO_LABEL,
		VENTA_ESTADO,
		type MetodoPago
	} from '#lib/constants/index.ts';
	import { CreditCardIcon, ScanBarcodeIcon, WalletIcon } from '#lib/icons/outline/index.ts';
	import type { Venta, VentaDetalle } from '#lib/interfaces/index.ts';
	import { errorService, ventaService } from '#lib/services/index.ts';
	import {
		alert,
		calcularCambio,
		formatCurrency,
		formatVentaNumero,
		parseMonto
	} from '#lib/utils/index.ts';

	interface Props {
		/** Pedido pendiente a cobrar; null = cerrado */
		venta: Venta | VentaDetalle | null;
		onClose: () => void;
		/** Venta ya cobrada (o actualizada aunque el cobro falle) */
		onSaved: (venta: VentaDetalle) => void;
	}

	let { venta, onClose, onSaved }: Props = $props();

	const METODO_OPTIONS = [
		{ value: METODO_PAGO.EFECTIVO, label: METODO_PAGO_LABEL.EFECTIVO, icon: WalletIcon },
		{ value: METODO_PAGO.QR, label: METODO_PAGO_LABEL.QR, icon: ScanBarcodeIcon },
		{
			value: METODO_PAGO.TRANSFERENCIA,
			label: METODO_PAGO_LABEL.TRANSFERENCIA,
			icon: CreditCardIcon
		}
	];

	const id = $props.id();
	let metodo = $state<MetodoPago | null>(null);
	let recalcular = $state(false);
	let pagaCon = $state('');
	let metodoError = $state('');
	let submitError = $state('');
	let isLoading = $state(false);

	const cambio = $derived(
		venta && metodo === METODO_PAGO.EFECTIVO && !recalcular
			? calcularCambio(venta.total, pagaCon)
			: null
	);

	// Cada apertura parte de los datos del pedido
	$effect(() => {
		const current = venta;
		untrack(() => {
			metodo = current?.metodo_pago ?? null;
			recalcular = false;
			pagaCon = '';
			metodoError = '';
			submitError = '';
		});
	});

	function handleClose() {
		if (!isLoading) onClose();
	}

	async function handleConfirm() {
		if (!venta || isLoading) return;
		if (!metodo) {
			metodoError = 'Selecciona el método de pago.';
			return;
		}
		const target = venta;
		isLoading = true;
		submitError = '';
		let actualizada: VentaDetalle | null = null;
		try {
			// El método de pago se guarda con el reemplazo de ítems (los mismos, con su precio ofrecido)
			if (metodo !== target.metodo_pago) {
				const detalle = 'items' in target ? target : await ventaService.get(target.id);
				actualizada = await ventaService.replaceItems(target.id, {
					metodo_pago: metodo,
					items: detalle.items.map((item) => ({
						sku_id: item.sku_id,
						cantidad: item.cantidad,
						descuento_unitario: item.descuento_unitario
					}))
				});
			}
			const cobrada = await ventaService.cambiarEstado(target.id, {
				estado: VENTA_ESTADO.CONFIRMADA,
				recalcular_precios: recalcular
			});
			alert('success', `Venta ${formatVentaNumero(cobrada.numero)} cobrada.`);
			onSaved(cobrada);
			onClose();
		} catch (error) {
			if (actualizada) onSaved(actualizada);
			submitError = errorService.getMessage(error);
		} finally {
			isLoading = false;
		}
	}
</script>

<Sheet
	open={!!venta}
	title="Cobrar pedido"
	description={venta
		? `${formatVentaNumero(venta.numero)}${venta.referencia ? ` · ${venta.referencia}` : ''}`
		: undefined}
	onClose={handleClose}
	dismissible={!isLoading}
>
	{#if venta}
		<div class="space-y-4">
			<div
				class="flex items-baseline justify-between border border-light-one_d px-4 py-3 dark:border-dark-one_d"
			>
				<span class="text-sm text-light-two_d dark:text-dark-two_d">Total a cobrar</span>
				<span class="text-2xl font-bold text-light-two tabular-nums dark:text-dark-two">
					{formatCurrency(venta.total)}
				</span>
			</div>

			<SegmentedControl
				label="Método de pago"
				options={METODO_OPTIONS}
				value={metodo}
				onChange={(value: MetodoPago) => {
					metodo = value;
					metodoError = '';
				}}
				disabled={isLoading}
				error={metodoError}
				size="lg"
			/>

			{#if metodo === METODO_PAGO.EFECTIVO && !recalcular}
				<div class="flex items-end gap-3">
					<div>
						<label
							for="{id}-paga-con"
							class="mb-1 block text-sm font-medium text-light-two dark:text-dark-two"
						>
							Paga con (Bs)
						</label>
						<input
							id="{id}-paga-con"
							type="text"
							inputmode="decimal"
							placeholder="0,00"
							bind:value={pagaCon}
							disabled={isLoading}
							class="block h-11 w-36 border border-light-four bg-light-one px-3 text-base text-light-two outline-none focus:border-light-three dark:border-dark-four_d dark:bg-dark-one dark:text-dark-two dark:focus:border-dark-three"
						/>
					</div>
					<p class="pb-2.5 text-sm text-light-two_d dark:text-dark-two_d" aria-live="polite">
						{#if cambio !== null}
							Cambio:
							<span class="text-base font-semibold text-light-two dark:text-dark-two">
								{formatCurrency(cambio)}
							</span>
						{:else if pagaCon.trim() && parseMonto(pagaCon) !== null}
							<span class="text-light-error dark:text-dark-error">Monto insuficiente</span>
						{/if}
					</p>
				</div>
			{/if}

			<label
				class="flex cursor-pointer items-start gap-2.5 border border-light-one_d p-3 text-sm dark:border-dark-one_d"
			>
				<input
					type="checkbox"
					bind:checked={recalcular}
					disabled={isLoading}
					class="mt-0.5 size-4 accent-light-three dark:accent-dark-three"
				/>
				<span>
					<span class="font-medium text-light-two dark:text-dark-two">
						Cobrar con los precios de hoy
					</span>
					<span class="block text-light-two_d dark:text-dark-two_d">
						Por defecto se cobra tal como se ofreció. Márcalo si quieres aplicar los precios y
						rebajas vigentes: el total puede cambiar.
					</span>
				</span>
			</label>

			<p class="text-sm text-light-two_d dark:text-dark-two_d">
				Al cobrar se descuenta el stock. Si alguna prenda ya no alcanza, no se cobrará.
			</p>

			{#if submitError}
				<AlertBox>{submitError}</AlertBox>
			{/if}
		</div>
	{/if}

	{#snippet footer()}
		<div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
			<Button variant="outline" onclick={handleClose} disabled={isLoading}>Cancelar</Button>
			<Button onclick={handleConfirm} loading={isLoading}>
				Cobrar {venta && !recalcular ? formatCurrency(venta.total) : ''}
			</Button>
		</div>
	{/snippet}
</Sheet>
