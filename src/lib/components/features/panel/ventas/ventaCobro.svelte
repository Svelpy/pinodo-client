<script lang="ts">
	import {
		AlertBox,
		Button,
		Input,
		SegmentedControl,
		SegmentedPicker,
		TextArea
	} from '#lib/components/ui/index.ts';
	import { VENTA_CANAL, type VentaCanal } from '#lib/constants/index.ts';
	import { UserIcon } from '#lib/icons/outline/index.ts';
	import type { CarritoAccion, CarritoLinea, VentaCheckoutValues } from '#lib/interfaces/index.ts';
	import {
		calcularTotales,
		compararPrecios,
		formatCurrency,
		parseMonto,
		tieneErrores,
		validarLinea
	} from '#lib/utils/index.ts';
	import { VENTA_LIMITS } from '#lib/zod/index.ts';
	import { CANAL_OPCIONES, esCanalADistancia } from './ventaOpciones.ts';
	import VentaPagos from './ventaPagos.svelte';

	interface Props {
		lineas: CarritoLinea[];
		checkout: VentaCheckoutValues;
		/** Monto con que paga en efectivo, solo para calcular el cambio */
		pagaCon: string;
		/** nueva = registrar; edicion = pedido guardado */
		modo?: 'nueva' | 'edicion';
		/** Edición: guardar con los precios de hoy (`recalcular_precios`) */
		recalcular?: boolean;
		/** Edición: hay precios distintos a los ofrecidos y se puede elegir */
		mostrarRecalcular?: boolean;
		/** Errores de los datos del cobro, con la ruta completa (`descuento`, `pagos.0.monto`) */
		errores?: Record<string, string>;
		/** Error de la API al guardar */
		submitError?: string;
		/** Acción en curso */
		submitting?: CarritoAccion | null;
		/** Puede cobrar ahora (además de guardar como pedido); en edición nunca: se cobra desde el detalle */
		puedeCobrar?: boolean;
		onSubmit: (accion: CarritoAccion) => void;
		/** Sin el encabezado "Cobro" (en la hoja de móvil el título lo pone la propia hoja) */
		hideHeader?: boolean;
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
		onSubmit,
		hideHeader = false
	}: Props = $props();

	const id = $props.id();

	const descuentoGlobal = $derived(parseMonto(checkout.descuento) ?? 0);
	const totales = $derived(calcularTotales(lineas, descuentoGlobal, recalcular));
	const lineasConError = $derived(
		lineas.filter((linea) => tieneErrores(validarLinea(linea, recalcular))).length
	);
	const vacio = $derived(lineas.length === 0);
	const bloqueado = $derived(vacio || lineasConError > 0 || submitting !== null);
	const esWhatsapp = $derived(checkout.canal === VENTA_CANAL.WHATSAPP);
	const aDistancia = $derived(esCanalADistancia(checkout.canal));
	// En mostrador lo normal es cobrar; un pedido a distancia (WhatsApp, redes…) se guarda hasta que pague
	const cobrarPrincipal = $derived(puedeCobrar && !aDistancia);

	let clienteAbierto = $state(false);
	let extrasAbierto = $state(false);
	const mostrarCliente = $derived(
		aDistancia || clienteAbierto || !!checkout.referencia || !!checkout.cliente_telefono
	);
	const mostrarExtras = $derived(
		extrasAbierto || !!checkout.descuento || !!checkout.nota || !!errores.descuento
	);

	const cobrarLabel = $derived(`Cobrar ${formatCurrency(totales.total)}`);
	const pedidoLabel = $derived(modo === 'edicion' ? 'Guardar cambios' : 'Guardar pedido');

	// Edición: cuánto cambia el total si se usan los precios de hoy
	const comparacion = $derived(compararPrecios(lineas, descuentoGlobal));
	const diferencia = $derived(comparacion.totalHoy - comparacion.totalOfrecido);
	const PRECIO_OPCIONES = [
		{ value: 'ofrecidos', label: 'Mantener ofrecidos' },
		{ value: 'hoy', label: 'Usar los de hoy' }
	] as const;

	const disclosureClass =
		'inline-flex h-9 items-center gap-1.5 text-sm font-medium text-light-accent hover:underline dark:text-dark-accent';
</script>

<div class="flex h-full min-h-0 flex-1 flex-col">
	{#if !hideHeader}
		<header class="shrink-0 border-b border-light-one_d px-3 py-2.5 sm:px-4 dark:border-dark-one_d">
			<h2 class="font-semibold text-light-two dark:text-dark-two">
				{modo === 'edicion' ? 'Resumen del pedido' : 'Cobro'}
			</h2>
		</header>
	{/if}

	<div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
		<!-- Datos del cobro -->
		<div class="space-y-4 px-3 py-4 sm:px-4">
			<SegmentedPicker
				label="Canal"
				options={CANAL_OPCIONES.frecuentes}
				more={CANAL_OPCIONES.mas}
				moreLabel="Más"
				value={checkout.canal}
				onChange={(canal: VentaCanal) => (checkout.canal = canal)}
				disabled={submitting !== null}
				error={errores.canal}
			/>

			{#if mostrarCliente}
				<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
					<Input
						id="{id}-referencia"
						label={aDistancia ? 'Cliente' : 'Cliente (opcional)'}
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
						label={esWhatsapp
							? 'WhatsApp del cliente'
							: aDistancia
								? 'Teléfono del cliente'
								: 'Teléfono (opcional)'}
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

			{#if puedeCobrar}
				<VentaPagos
					bind:pagos={checkout.pagos}
					bind:pagaCon
					total={totales.total}
					{errores}
					label={cobrarPrincipal ? 'Método de pago' : 'Método de pago (solo si cobras ahora)'}
					disabled={submitting !== null}
				/>
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
				<section
					aria-labelledby="{id}-precios"
					class="space-y-3 border border-light-warning/60 bg-light-warning/5 p-3 dark:border-dark-warning/50 dark:bg-dark-warning/10"
				>
					<div>
						<h3 id="{id}-precios" class="text-sm font-semibold text-light-two dark:text-dark-two">
							Precios
						</h3>
						<p class="text-sm text-light-two_d dark:text-dark-two_d">
							{comparacion.cambiadas === 1
								? '1 prenda cambió de precio'
								: `${comparacion.cambiadas} prendas cambiaron de precio`} desde que se ofreció el pedido.
							¿Con cuáles lo guardas?
						</p>
					</div>
					<SegmentedControl
						label="Precios del pedido"
						showLabel={false}
						options={PRECIO_OPCIONES}
						value={recalcular ? 'hoy' : 'ofrecidos'}
						onChange={(opcion) => (recalcular = opcion === 'hoy')}
						disabled={submitting !== null}
						columns={2}
					/>
					<dl class="grid grid-cols-2 gap-2 text-sm tabular-nums">
						<div>
							<dt class="text-xs text-light-two_d dark:text-dark-two_d">Total ofrecido</dt>
							<dd
								class={[
									'font-semibold',
									recalcular
										? 'text-light-two_d line-through dark:text-dark-two_d'
										: 'text-light-two dark:text-dark-two'
								]}
							>
								{formatCurrency(comparacion.totalOfrecido)}
							</dd>
						</div>
						<div>
							<dt class="text-xs text-light-two_d dark:text-dark-two_d">
								Total con precios de hoy
							</dt>
							<dd
								class={[
									'font-semibold',
									recalcular
										? 'text-light-two dark:text-dark-two'
										: 'text-light-two_d line-through dark:text-dark-two_d'
								]}
							>
								{formatCurrency(comparacion.totalHoy)}
							</dd>
						</div>
					</dl>
					{#if diferencia !== 0}
						<p class="text-xs text-light-two_d dark:text-dark-two_d">
							Con los precios de hoy el cliente paga
							<span class="font-semibold text-light-two dark:text-dark-two">
								{formatCurrency(Math.abs(diferencia))}
								{diferencia > 0 ? 'más' : 'menos'}</span
							>. Los descuentos que pusiste se mantienen.
						</p>
					{/if}
				</section>
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
		{#if modo === 'edicion'}
			<p class="text-center text-xs text-light-two_d dark:text-dark-two_d">
				El pedido sigue pendiente: lo cobras desde su detalle.
			</p>
		{/if}
	</footer>
</div>
