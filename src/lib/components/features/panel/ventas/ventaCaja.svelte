<script lang="ts">
	import { onDestroy, onMount, untrack } from 'svelte';
	import { AlertBox, Sheet } from '#lib/components/ui/index.ts';
	import { METODO_PAGO, VENTA_CANAL, VENTA_ESTADO } from '#lib/constants/index.ts';
	import { ShoppingCartIcon } from '#lib/icons/outline/index.ts';
	import type {
		CajaAviso,
		CarritoAccion,
		CarritoLinea,
		SkuInventario,
		VentaCheckoutValues,
		VentaDetalle
	} from '#lib/interfaces/index.ts';
	import { AppError, errorService, skuService, ventaService } from '#lib/services/index.ts';
	import {
		agregarAlCarrito,
		borrarBorradorVenta,
		calcularCambio,
		calcularTotales,
		descontarStock,
		formatCurrency,
		formatRelativeTime,
		guardarBorradorVenta,
		hayPreciosDistintos,
		leerBorradorVenta,
		parseMonto,
		sincronizarLineas,
		toItemsRequest,
		validateSchema
	} from '#lib/utils/index.ts';
	import { createVentaCheckoutSchema } from '#lib/zod/index.ts';
	import VentaBuscador from './ventaBuscador.svelte';
	import VentaCarrito from './ventaCarrito.svelte';
	import VentaCatalogo from './ventaCatalogo.svelte';
	import VentaExitoModal from './ventaExitoModal.svelte';
	import VentaScannerModal, { soportaEscaneoCamara } from './ventaScannerModal.svelte';

	interface Props {
		/** Pedido pendiente que se edita; sin él se registra una venta nueva */
		venta?: VentaDetalle | null;
		/** Líneas del pedido que se edita (con stock y precio de hoy) */
		lineasIniciales?: CarritoLinea[];
		/** Puede registrar o modificar ventas (si no, solo consulta el inventario) */
		puedeVender?: boolean;
		/** Edición guardada (y cobrada, si `cobrada`) */
		onGuardado?: (venta: VentaDetalle, cobrada: boolean) => void;
	}

	let { venta = null, lineasIniciales = [], puedeVender = true, onGuardado }: Props = $props();

	const PER_PAGE = 50;
	const RESALTADO_MS = 1200;
	const modo = $derived(venta ? 'edicion' : 'nueva');

	const checkoutInicial = (base?: VentaDetalle | null): VentaCheckoutValues => ({
		canal: base?.canal ?? VENTA_CANAL.TIENDA,
		metodo_pago: base?.metodo_pago ?? null,
		referencia: base?.referencia ?? '',
		cliente_telefono: base?.cliente_telefono ?? '',
		descuento: base?.descuento ? String(base.descuento) : '',
		nota: base?.nota ?? ''
	});

	// ── Carrito ───────────────────────────────────────────────────────────────────────────────
	// svelte-ignore state_referenced_locally
	let lineas = $state<CarritoLinea[]>(lineasIniciales);
	// svelte-ignore state_referenced_locally
	let checkout = $state<VentaCheckoutValues>(checkoutInicial(venta));
	let pagaCon = $state('');
	let recalcular = $state(false);
	let erroresCheckout = $state<Record<string, string>>({});
	let submitError = $state('');
	let submitting = $state<CarritoAccion | null>(null);
	let resaltada = $state<string | null>(null);
	let resaltadoTimer: ReturnType<typeof setTimeout> | undefined;

	// svelte-ignore state_referenced_locally
	const mostrarRecalcular = hayPreciosDistintos(lineasIniciales);
	const totales = $derived(
		calcularTotales(lineas, parseMonto(checkout.descuento) ?? 0, recalcular)
	);
	const enCarrito = $derived(new Map(lineas.map((linea) => [linea.sku_id, linea.cantidad])));

	// ── Borrador (solo venta nueva) ───────────────────────────────────────────────────────────
	let borradorListo = $state(false);
	let borradorRecuperado = $state<string | null>(null);

	// ── Catálogo ──────────────────────────────────────────────────────────────────────────────
	let skus = $state<SkuInventario[]>([]);
	let catalogoTotal = $state(0);
	let catalogoPage = $state(1);
	let catalogoTotalPages = $state(1);
	let nombre = $state('');
	let enRebaja = $state(false);
	let catalogoLoading = $state(false);
	let catalogoError = $state('');
	let lastRequestId = 0;

	let aviso = $state<CajaAviso | null>(null);
	let buscandoCodigo = $state(false);
	let buscador = $state<ReturnType<typeof VentaBuscador>>();
	let scannerOpen = $state(false);
	const puedeEscanear = soportaEscaneoCamara();

	// ── Diálogos ──────────────────────────────────────────────────────────────────────────────
	let carritoAbierto = $state(false);
	let ventaRegistrada = $state<VentaDetalle | null>(null);
	let cambioRegistrado = $state<number | null>(null);

	async function loadCatalogo(page = 1) {
		const requestId = ++lastRequestId;
		catalogoError = '';
		catalogoLoading = true;
		try {
			const response = await skuService.inventario({
				page,
				per_page: PER_PAGE,
				nombre: nombre || undefined,
				en_rebaja: enRebaja || undefined
			});
			if (requestId !== lastRequestId) return;
			skus = page > 1 ? [...skus, ...response.data] : response.data;
			catalogoPage = response.page;
			catalogoTotalPages = Math.max(1, response.total_pages);
			catalogoTotal = response.total;
			// El carrito se queda con el stock y el precio más recientes
			lineas = sincronizarLineas(lineas, response.data);
		} catch (error) {
			if (requestId !== lastRequestId) return;
			catalogoError = errorService.getMessage(error);
		} finally {
			if (requestId === lastRequestId) catalogoLoading = false;
		}
	}

	function handleNombreChange(value: string) {
		if (value === nombre) return;
		nombre = value;
		skus = [];
		loadCatalogo();
	}

	function handleEnRebajaChange(value: boolean) {
		enRebaja = value;
		skus = [];
		loadCatalogo();
	}

	function resaltar(skuId: string) {
		clearTimeout(resaltadoTimer);
		resaltada = skuId;
		resaltadoTimer = setTimeout(() => (resaltada = null), RESALTADO_MS);
	}

	function agregar(sku: SkuInventario) {
		if (submitting) return;
		const result = agregarAlCarrito(lineas, sku);
		if (!result.ok) {
			aviso = { tipo: 'error', texto: result.error };
			return;
		}
		lineas = result.lineas;
		submitError = '';
		aviso = {
			tipo: 'success',
			texto: `${sku.producto_nombre} · ${sku.color_nombre} · ${sku.talla_etiqueta} agregado${result.cantidad > 1 ? ` (${result.cantidad})` : ''}.`
		};
		resaltar(sku.id);
	}

	async function buscarCodigo(codigo: string) {
		buscandoCodigo = true;
		aviso = null;
		try {
			const response = await skuService.inventario({ codigo_barras: codigo, per_page: 5 });
			const [sku] = response.data;
			if (sku) {
				agregar(sku);
				lineas = sincronizarLineas(lineas, response.data);
			} else {
				aviso = { tipo: 'error', texto: `Ningún producto activo tiene el código ${codigo}.` };
			}
		} catch (error) {
			aviso = { tipo: 'error', texto: errorService.getMessage(error) };
		} finally {
			buscandoCodigo = false;
			buscador?.focus();
		}
	}

	function handleScan(codigo: string) {
		scannerOpen = false;
		buscarCodigo(codigo);
	}

	function setCantidad(skuId: string, cantidad: number) {
		lineas = lineas.map((linea) =>
			linea.sku_id === skuId ? { ...linea, cantidad: Math.max(1, Math.trunc(cantidad)) } : linea
		);
	}

	function setDescuento(skuId: string, descuento: string) {
		lineas = lineas.map((linea) =>
			linea.sku_id === skuId ? { ...linea, descuento_unitario: descuento } : linea
		);
	}

	function quitar(skuId: string) {
		lineas = lineas.filter((linea) => linea.sku_id !== skuId);
		submitError = '';
	}

	function reset() {
		// Se conserva el canal: suele repetirse (varios pedidos de WhatsApp seguidos)
		lineas = [];
		checkout = { ...checkoutInicial(), canal: checkout.canal };
		pagaCon = '';
		erroresCheckout = {};
		submitError = '';
		aviso = null;
		borradorRecuperado = null;
	}

	function vaciar() {
		reset();
		borrarBorradorVenta();
		buscador?.focus();
	}

	async function submit(accion: CarritoAccion) {
		if (submitting || lineas.length === 0) return;
		const cobrar = accion === 'cobrar';
		const result = validateSchema(
			createVentaCheckoutSchema({ cobrar, subtotal: totales.subtotal }),
			$state.snapshot(checkout)
		);
		if (!result.success) {
			erroresCheckout = result.errors;
			return;
		}

		erroresCheckout = {};
		submitError = '';
		submitting = accion;
		const items = toItemsRequest(lineas);
		const cambio =
			cobrar && checkout.metodo_pago === METODO_PAGO.EFECTIVO
				? calcularCambio(totales.total, pagaCon)
				: null;
		let guardadoSinCobrar: VentaDetalle | null = null;

		try {
			if (!venta) {
				const creada = await ventaService.create({
					...result.data,
					estado: cobrar ? VENTA_ESTADO.CONFIRMADA : VENTA_ESTADO.PENDIENTE,
					items
				});
				if (cobrar) skus = descontarStock(skus, items);
				borrarBorradorVenta();
				reset();
				carritoAbierto = false;
				cambioRegistrado = cambio;
				ventaRegistrada = creada;
				return;
			}

			let actualizada = await ventaService.replaceItems(venta.id, {
				...result.data,
				items,
				recalcular_precios: recalcular
			});
			if (cobrar) {
				guardadoSinCobrar = actualizada;
				actualizada = await ventaService.cambiarEstado(venta.id, {
					estado: VENTA_ESTADO.CONFIRMADA
				});
			}
			onGuardado?.(actualizada, cobrar);
		} catch (error) {
			const fieldErrors = errorService.getFieldErrors(error);
			erroresCheckout = Object.fromEntries(
				Object.entries(fieldErrors).filter(([field]) => field in checkout)
			);
			const message = errorService.getMessage(error);
			submitError = guardadoSinCobrar
				? `Los cambios se guardaron, pero no se pudo cobrar: ${message}`
				: message;
			// Sin stock suficiente: se refresca para mostrar lo disponible
			if (error instanceof AppError && error.status === 409) loadCatalogo();
		} finally {
			submitting = null;
		}
	}

	function nuevaVenta() {
		ventaRegistrada = null;
		cambioRegistrado = null;
		buscador?.focus();
	}

	function descartarBorrador() {
		vaciar();
	}

	// Los errores del cobro se borran al corregir los datos
	$effect(() => {
		JSON.stringify(checkout);
		untrack(() => {
			if (Object.keys(erroresCheckout).length > 0) erroresCheckout = {};
		});
	});

	// Guarda la venta en curso para recuperarla si se recarga o se cierra la pestaña
	$effect(() => {
		if (venta || !borradorListo) return;
		guardarBorradorVenta({
			lineas: $state.snapshot(lineas),
			checkout: $state.snapshot(checkout)
		});
	});

	// Al pasar a escritorio el carrito ya está a la vista: se cierra la hoja
	$effect(() => {
		const query = window.matchMedia('(min-width: 1024px)');
		const handleChange = () => {
			if (query.matches) carritoAbierto = false;
		};
		query.addEventListener('change', handleChange);
		return () => query.removeEventListener('change', handleChange);
	});

	onMount(() => {
		if (!venta) {
			const borrador = leerBorradorVenta();
			if (borrador) {
				lineas = borrador.lineas;
				checkout = { ...checkoutInicial(), ...borrador.checkout };
				borradorRecuperado = borrador.guardado_at;
			}
			borradorListo = true;
		}
		loadCatalogo();
	});

	onDestroy(() => clearTimeout(resaltadoTimer));
</script>

{#snippet carrito()}
	<VentaCarrito
		{lineas}
		bind:checkout
		bind:pagaCon
		bind:recalcular
		{modo}
		{mostrarRecalcular}
		errores={erroresCheckout}
		{submitError}
		{submitting}
		puedeCobrar={puedeVender}
		{resaltada}
		onCantidadChange={setCantidad}
		onDescuentoChange={setDescuento}
		onRemove={quitar}
		onVaciar={venta ? undefined : vaciar}
		onSubmit={submit}
	/>
{/snippet}

<div
	class="pb-24 lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start lg:gap-6 lg:pb-0 2xl:grid-cols-[minmax(0,1fr)_28rem]"
>
	<div class="min-w-0 space-y-3">
		{#if borradorRecuperado}
			<AlertBox variant="info">
				Recuperamos la venta que estabas armando ({formatRelativeTime(borradorRecuperado)}).
				{#snippet action()}
					<button
						type="button"
						onclick={descartarBorrador}
						class="font-medium underline underline-offset-2"
					>
						Descartar
					</button>
				{/snippet}
			</AlertBox>
		{/if}

		<VentaBuscador
			bind:this={buscador}
			{nombre}
			{enRebaja}
			{aviso}
			{buscandoCodigo}
			onNombreChange={handleNombreChange}
			onCodigo={buscarCodigo}
			onEnRebajaChange={handleEnRebajaChange}
			onScan={puedeEscanear ? () => (scannerOpen = true) : undefined}
		/>

		<VentaCatalogo
			{skus}
			total={catalogoTotal}
			{enCarrito}
			busqueda={nombre}
			isLoading={catalogoLoading}
			error={catalogoError}
			hasMore={catalogoPage < catalogoTotalPages}
			onLoadMore={() => loadCatalogo(catalogoPage + 1)}
			onRetry={() => loadCatalogo()}
			onAdd={agregar}
			disabled={!puedeVender || submitting !== null}
		/>
	</div>

	<!-- Escritorio: el carrito queda fijo a la derecha mientras se recorre el catálogo -->
	<aside
		aria-label="Carrito"
		class="sticky top-20 hidden max-h-[calc(100dvh-7.5rem)] flex-col border border-light-one_d bg-light-one lg:flex dark:border-dark-one_d dark:bg-dark-one"
	>
		{@render carrito()}
	</aside>
</div>

<!-- Móvil y tablet: barra inferior con el resumen; el carrito se abre en una hoja -->
<div
	class="fixed inset-x-0 bottom-0 z-20 border-t border-light-one_d bg-light-one px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:hidden dark:border-dark-one_d dark:bg-dark-one"
>
	<button
		type="button"
		onclick={() => (carritoAbierto = true)}
		class="flex h-12 w-full items-center justify-between gap-3 bg-light-three px-4 text-light-one transition-colors active:bg-light-three_d dark:bg-dark-three dark:text-dark-one"
		aria-label="Ver carrito: {totales.unidades} {totales.unidades === 1
			? 'prenda'
			: 'prendas'}, total {formatCurrency(totales.total)}"
	>
		<span class="flex items-center gap-2 font-medium">
			<span class="relative">
				<ShoppingCartIcon class="size-5" />
				{#if totales.unidades > 0}
					<span
						class="absolute -top-2 -right-2.5 inline-flex min-w-4 items-center justify-center bg-light-accent px-1 text-[0.625rem] font-bold text-light-one dark:bg-dark-accent dark:text-dark-one"
					>
						{totales.unidades}
					</span>
				{/if}
			</span>
			<span class="ml-1">{venta ? 'Ver pedido' : 'Ver carrito'}</span>
		</span>
		<span class="text-lg font-bold tabular-nums">{formatCurrency(totales.total)}</span>
	</button>
</div>

<Sheet
	open={carritoAbierto}
	title={venta ? 'Pedido' : 'Carrito'}
	hideTitle
	onClose={() => {
		if (!submitting) carritoAbierto = false;
	}}
	dismissible={!submitting}
>
	{#if carritoAbierto}
		<div class="-mx-5 -mt-3 -mb-5 md:-mx-6">
			{@render carrito()}
		</div>
	{/if}
</Sheet>

<VentaScannerModal
	isOpen={scannerOpen}
	onClose={() => (scannerOpen = false)}
	onDetected={handleScan}
/>

<VentaExitoModal venta={ventaRegistrada} cambio={cambioRegistrado} onNuevaVenta={nuevaVenta} />
