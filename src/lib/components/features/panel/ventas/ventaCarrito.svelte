<script lang="ts">
	import { AlertBox, Button, Input, SegmentedControl, TextArea } from '#lib/components/ui/index.ts';
	import {
		METODO_PAGO,
		METODO_PAGO_LABEL,
		VENTA_CANAL,
		VENTA_CANAL_LABEL,
		type MetodoPago,
		type VentaCanal
	} from '#lib/constants/index.ts';
	import {
		BuildindStoreIcon,
		CreditCardIcon,
		ScanBarcodeIcon,
		ShoppingCartIcon,
		TrashIcon,
		UserIcon,
		WalletIcon,
		WhatsappIcon
	} from '#lib/icons/outline/index.ts';
	import type { CarritoAccion, CarritoLinea, VentaCheckoutValues } from '#lib/interfaces/index.ts';
	import {
		calcularCambio,
		calcularTotales,
		formatCurrency,
		parseMonto,
		tieneErrores,
		validarLinea
	} from '#lib/utils/index.ts';
	import { VENTA_LIMITS } from '#lib/zod/index.ts';
	import VentaCarritoLinea from './ventaCarritoLinea.svelte';

	interface Props {
		lineas: CarritoLinea[];
		checkout: VentaCheckoutValues;
		/** Monto con que paga en efectivo, solo para calcular el cambio */
		pagaCon: string;
		/** nueva = registrar; edicion = pedido guardado */
		modo?: 'nueva' | 'edicion';
		/** Edición: cobrar con los precios de hoy */
		recalcular?: boolean;
		/** Edición: hay precios distintos a los ofrecidos y se puede elegir */
		mostrarRecalcular?: boolean;
		/** Errores de los datos del cobro por campo */
		errores?: Record<string, string>;
		/** Error de la API al guardar */
		submitError?: string;
		/** Acción en curso */
		submitting?: CarritoAccion | null;
		/** Puede cobrar ahora (además de guardar como pedido) */
		puedeCobrar?: boolean;
		/** Línea recién agregada, para resaltarla */
		resaltada?: string | null;
		onCantidadChange: (skuId: string, cantidad: number) => void;
		onDescuentoChange: (skuId: string, descuento: string) => void;
		onRemove: (skuId: string) => void;
		onVaciar?: () => void;
		onSubmit: (accion: CarritoAccion) => void;
	}

	let {
		lineas,
		checkout = $bindable(),
		pagaCon = $bindable(),
		modo = 'nueva',
		recalcular = $bindable(false),
		mostrarRecalcular = false,
		errores = {},
		submitError = '',
		submitting = null,
		puedeCobrar = true,
		resaltada = null,
		onCantidadChange,
		onDescuentoChange,
		onRemove,
		onVaciar,
		onSubmit
	}: Props = $props();

	const id = $props.id();

	const CANAL_OPTIONS = [
		{ value: VENTA_CANAL.TIENDA, label: VENTA_CANAL_LABEL.TIENDA, icon: BuildindStoreIcon },
		{ value: VENTA_CANAL.WHATSAPP, label: VENTA_CANAL_LABEL.WHATSAPP, icon: WhatsappIcon }
	];
	const METODO_OPTIONS = [
		{ value: METODO_PAGO.EFECTIVO, label: METODO_PAGO_LABEL.EFECTIVO, icon: WalletIcon },
		{ value: METODO_PAGO.QR, label: METODO_PAGO_LABEL.QR, icon: ScanBarcodeIcon },
		{
			value: METODO_PAGO.TRANSFERENCIA,
			label: METODO_PAGO_LABEL.TRANSFERENCIA,
			icon: CreditCardIcon
		}
	];

	const descuentoGlobal = $derived(parseMonto(checkout.descuento) ?? 0);
	const totales = $derived(calcularTotales(lineas, descuentoGlobal, recalcular));
	const lineasConError = $derived(
		lineas.filter((linea) => tieneErrores(validarLinea(linea, recalcular))).length
	);
	const vacio = $derived(lineas.length === 0);
	const bloqueado = $derived(vacio || lineasConError > 0 || submitting !== null);
	const esWhatsapp = $derived(checkout.canal === VENTA_CANAL.WHATSAPP);
	// En mostrador lo normal es cobrar; un pedido de WhatsApp se guarda hasta que pague
	const cobrarPrincipal = $derived(puedeCobrar && (modo === 'edicion' || !esWhatsapp));
	const cambio = $derived(
		checkout.metodo_pago === METODO_PAGO.EFECTIVO ? calcularCambio(totales.total, pagaCon) : null
	);

	let clienteAbierto = $state(false);
	let extrasAbierto = $state(false);
	const mostrarCliente = $derived(
		esWhatsapp || clienteAbierto || !!checkout.referencia || !!checkout.cliente_telefono
	);
	const mostrarExtras = $derived(
		extrasAbierto || !!checkout.descuento || !!checkout.nota || !!errores.descuento
	);

	const cobrarLabel = $derived(
		modo === 'edicion'
			? `Guardar y cobrar ${formatCurrency(totales.total)}`
			: `Cobrar ${formatCurrency(totales.total)}`
	);
	const pedidoLabel = $derived(modo === 'edicion' ? 'Guardar cambios' : 'Guardar pedido');

	const disclosureClass =
		'inline-flex h-9 items-center gap-1.5 text-sm font-medium text-light-accent hover:underline dark:text-dark-accent';
</script>

<div class="flex h-full min-h-0 flex-col">
	<header
		class="flex shrink-0 items-center justify-between gap-2 border-b border-light-one_d px-3 py-2.5 sm:px-4 dark:border-dark-one_d"
	>
		<h2 class="flex items-center gap-2 font-semibold text-light-two dark:text-dark-two">
			<ShoppingCartIcon class="size-5" />
			{modo === 'edicion' ? 'Pedido' : 'Carrito'}
			{#if totales.unidades > 0}
				<span class="text-sm font-normal text-light-two_d dark:text-dark-two_d">
					({totales.unidades}
					{totales.unidades === 1 ? 'prenda' : 'prendas'})
				</span>
			{/if}
		</h2>
		{#if onVaciar && !vacio}
			<button
				type="button"
				onclick={onVaciar}
				disabled={submitting !== null}
				class="inline-flex h-9 items-center gap-1 px-2 text-sm text-light-two_d transition-colors hover:text-light-error disabled:opacity-40 dark:text-dark-two_d dark:hover:text-dark-error"
			>
				<TrashIcon class="size-4" />
				Vaciar
			</button>
		{/if}
	</header>

	<div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
		{#if vacio}
			<div class="flex flex-col items-center px-6 py-10 text-center">
				<span
					class="flex size-12 items-center justify-center bg-light-one_d text-light-two_d dark:bg-dark-one_d dark:text-dark-two_d"
				>
					<ScanBarcodeIcon class="size-6" />
				</span>
				<p class="mt-3 font-medium text-light-two dark:text-dark-two">El carrito está vacío</p>
				<p class="mt-1 text-sm text-light-two_d dark:text-dark-two_d">
					Escanea una etiqueta o toca una talla para agregarla.
				</p>
			</div>
		{:else}
			<ul class="divide-y divide-light-one_d dark:divide-dark-one_d" aria-label="Prendas">
				{#each lineas as linea (linea.sku_id)}
					<VentaCarritoLinea
						{linea}
						{recalcular}
						resaltada={resaltada === linea.sku_id}
						disabled={submitting !== null}
						onCantidadChange={(cantidad) => onCantidadChange(linea.sku_id, cantidad)}
						onDescuentoChange={(descuento) => onDescuentoChange(linea.sku_id, descuento)}
						onRemove={() => onRemove(linea.sku_id)}
					/>
				{/each}
			</ul>
		{/if}

		<!-- Datos del cobro -->
		<div class="space-y-4 border-t border-light-one_d px-3 py-4 sm:px-4 dark:border-dark-one_d">
			<SegmentedControl
				label="Canal"
				options={CANAL_OPTIONS}
				value={checkout.canal}
				onChange={(canal: VentaCanal) => (checkout.canal = canal)}
				disabled={submitting !== null}
				error={errores.canal}
			/>

			{#if mostrarCliente}
				<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
					<Input
						id="{id}-referencia"
						label={esWhatsapp ? 'Cliente' : 'Cliente (opcional)'}
						placeholder="Nombre o referencia"
						autocomplete="off"
						maxlength={VENTA_LIMITS.REFERENCIA_MAX}
						bind:value={checkout.referencia}
						error={errores.referencia}
						disabled={submitting !== null}
					/>
					<Input
						id="{id}-telefono"
						type="tel"
						inputmode="tel"
						label={esWhatsapp ? 'WhatsApp del cliente' : 'Teléfono (opcional)'}
						placeholder="71234567"
						autocomplete="off"
						maxlength={VENTA_LIMITS.TELEFONO_MAX}
						bind:value={checkout.cliente_telefono}
						error={errores.cliente_telefono}
						disabled={submitting !== null}
					/>
				</div>
			{:else}
				<button type="button" class={disclosureClass} onclick={() => (clienteAbierto = true)}>
					<UserIcon class="size-4" />
					Agregar datos del cliente
				</button>
			{/if}

			<SegmentedControl
				label={puedeCobrar && !esWhatsapp
					? 'Método de pago'
					: 'Método de pago (opcional en pedidos)'}
				options={METODO_OPTIONS}
				value={checkout.metodo_pago}
				onChange={(metodo: MetodoPago) => (checkout.metodo_pago = metodo)}
				disabled={submitting !== null}
				error={errores.metodo_pago}
			/>

			{#if checkout.metodo_pago === METODO_PAGO.EFECTIVO && puedeCobrar}
				<div class="flex items-end gap-3">
					<Input
						id="{id}-paga-con"
						label="Paga con (Bs)"
						inputmode="decimal"
						placeholder="0,00"
						autocomplete="off"
						bind:value={pagaCon}
						class="w-36"
						disabled={submitting !== null}
					/>
					<p class="pb-2.5 text-sm text-light-two_d dark:text-dark-two_d" aria-live="polite">
						{#if cambio !== null}
							Cambio:
							<span class="text-base font-semibold text-light-two dark:text-dark-two">
								{formatCurrency(cambio)}
							</span>
						{:else if pagaCon.trim()}
							<span class="text-light-error dark:text-dark-error">Monto insuficiente</span>
						{/if}
					</p>
				</div>
			{/if}

			{#if mostrarExtras}
				<div class="space-y-3">
					<Input
						id="{id}-descuento"
						label="Descuento a la venta (Bs)"
						inputmode="decimal"
						placeholder="0,00"
						autocomplete="off"
						bind:value={checkout.descuento}
						error={errores.descuento}
						class="w-48"
						disabled={submitting !== null}
					/>
					<TextArea
						id="{id}-nota"
						label="Nota"
						rows={2}
						placeholder="p. ej. Recoge en tienda el sábado"
						maxlength={VENTA_LIMITS.NOTA_MAX}
						bind:value={checkout.nota}
						error={errores.nota}
						disabled={submitting !== null}
					/>
				</div>
			{:else}
				<button type="button" class={disclosureClass} onclick={() => (extrasAbierto = true)}>
					Agregar descuento o nota
				</button>
			{/if}

			{#if mostrarRecalcular}
				<label
					class="flex cursor-pointer items-start gap-2.5 border border-light-one_d p-3 text-sm dark:border-dark-one_d"
				>
					<input
						type="checkbox"
						bind:checked={recalcular}
						disabled={submitting !== null}
						class="mt-0.5 size-4 accent-light-three dark:accent-dark-three"
					/>
					<span>
						<span class="font-medium text-light-two dark:text-dark-two">
							Actualizar a los precios de hoy
						</span>
						<span class="block text-light-two_d dark:text-dark-two_d">
							Algunos precios cambiaron desde que se ofreció el pedido. Sin marcar, se conserva el
							precio ofrecido.
						</span>
					</span>
				</label>
			{/if}
		</div>
	</div>

	<!-- Totales y acciones: siempre visibles al pie -->
	<footer
		class="sticky bottom-0 shrink-0 space-y-3 border-t border-light-one_d bg-light-one px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4 dark:border-dark-one_d dark:bg-dark-one"
	>
		<dl class="space-y-1 text-sm">
			{#if totales.descuentoItems > 0 || totales.descuento > 0}
				<div class="flex justify-between text-light-two_d dark:text-dark-two_d">
					<dt>Subtotal</dt>
					<dd class="tabular-nums">{formatCurrency(totales.subtotal)}</dd>
				</div>
			{/if}
			{#if totales.descuentoItems > 0}
				<div class="flex justify-between text-xs text-light-two_d dark:text-dark-two_d">
					<dt>Incluye descuento en prendas</dt>
					<dd class="tabular-nums">−{formatCurrency(totales.descuentoItems)}</dd>
				</div>
			{/if}
			{#if totales.descuento > 0}
				<div class="flex justify-between text-light-two_d dark:text-dark-two_d">
					<dt>Descuento</dt>
					<dd class="tabular-nums">−{formatCurrency(totales.descuento)}</dd>
				</div>
			{/if}
			<div class="flex items-baseline justify-between">
				<dt class="font-semibold text-light-two dark:text-dark-two">Total</dt>
				<dd
					class="text-2xl font-bold text-light-two tabular-nums dark:text-dark-two"
					aria-live="polite"
				>
					{formatCurrency(totales.total)}
				</dd>
			</div>
		</dl>

		{#if submitError}
			<AlertBox>{submitError}</AlertBox>
		{/if}
		{#if lineasConError > 0}
			<p role="alert" class="text-sm text-light-error dark:text-dark-error">
				Corrige {lineasConError === 1
					? 'la prenda marcada'
					: `las ${lineasConError} prendas marcadas`}
				para continuar.
			</p>
		{/if}

		<div class={['flex gap-2', cobrarPrincipal ? 'flex-col' : 'flex-col-reverse']}>
			{#if puedeCobrar}
				<Button
					variant={cobrarPrincipal ? 'primary' : 'outline'}
					size="lg"
					fullWidth
					disabled={bloqueado}
					loading={submitting === 'cobrar'}
					onclick={() => onSubmit('cobrar')}
				>
					{cobrarLabel}
				</Button>
			{/if}
			<Button
				variant={cobrarPrincipal ? 'outline' : 'primary'}
				size="lg"
				fullWidth
				disabled={bloqueado}
				loading={submitting === 'pedido'}
				onclick={() => onSubmit('pedido')}
			>
				{pedidoLabel}
			</Button>
		</div>
	</footer>
</div>
