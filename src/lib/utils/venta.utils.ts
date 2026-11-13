import { Action, Module, type Role } from '#lib/config/permissions.config.ts';
import {
	METODO_PAGO,
	METODO_PAGO_LABEL,
	RANGO_FECHA,
	VENTA_BORRADOR_KEY,
	VENTA_ESTADO,
	type MetodoPago,
	type RangoFecha,
	type VentaEstado
} from '#lib/constants/index.ts';
import type {
	CarritoLinea,
	ListVentasParams,
	PagoLinea,
	SkuInventario,
	Venta,
	VentaBorrador,
	VentaDetalle,
	VentaFiltros,
	VentaItemRequest,
	VentaResumen
} from '#lib/interfaces/index.ts';
import { todayISO } from './date';
import { formatCurrency, formatVentaNumero } from './format';
import { can } from './rbac.utils';

// ── Permisos ──────────────────────────────────────────────────────────────────────────────────
// Espejo del backend: registrar es VENTA:CREATE; editar, cobrar y cancelar un pedido pendiente
// (PUT de ítems, /confirmar y /cancelar) es VENTA:UPDATE; anular una venta ya cobrada (devuelve el stock)
// exige VENTA:DELETE. Hoy: OWNER y ADMIN todo; el CAJERO no anula cobradas; SUPERADMIN solo consulta.

export function puedeRegistrarVenta(role: Role | null): boolean {
	return can(role, Module.VENTA, Action.CREATE);
}

export function puedeGestionarPendiente(role: Role | null): boolean {
	return can(role, Module.VENTA, Action.UPDATE);
}

export function puedeAnularCobrada(role: Role | null): boolean {
	return can(role, Module.VENTA, Action.DELETE);
}

/** Acciones que admite una venta según su estado y el rol */
export function accionesVenta(
	venta: { estado: VentaEstado },
	role: Role | null
): { editar: boolean; cobrar: boolean; cancelar: boolean } {
	const pendiente = venta.estado === VENTA_ESTADO.PENDIENTE;
	const gestionar = pendiente && puedeGestionarPendiente(role);
	return {
		editar: gestionar,
		cobrar: gestionar,
		cancelar: gestionar || (venta.estado === VENTA_ESTADO.CONFIRMADA && puedeAnularCobrada(role))
	};
}

// ── Montos ────────────────────────────────────────────────────────────────────────────────────
// Toda la aritmética va en céntimos enteros: 0.1 + 0.2 no debe dar 0.30000000000000004 en una caja.

export const MONTO_REGEX = /^\d+([.,]\d{1,2})?$/;

export const toCents = (value: number): number => Math.round(value * 100);
export const fromCents = (cents: number): number => cents / 100;

/** Monto escrito por el usuario ("12,50") → número; '' = 0; inválido = null */
export function parseMonto(value: string | null | undefined): number | null {
	const text = (value ?? '').trim();
	if (text === '') return 0;
	if (!MONTO_REGEX.test(text)) return null;
	return Number(text.replace(',', '.'));
}

/** Precio por unidad que se cobrará: el de hoy si se recalculan los precios y se conoce */
export function precioLinea(linea: CarritoLinea, recalcular = false): number {
	return recalcular && linea.precio_actual !== null ? linea.precio_actual : linea.precio_unitario;
}

/** Subtotal de la línea: (precio − descuento por unidad) × cantidad */
export function calcularLinea(linea: CarritoLinea, recalcular = false): number {
	const descuento = parseMonto(linea.descuento_unitario) ?? 0;
	const unitario = Math.max(0, toCents(precioLinea(linea, recalcular)) - toCents(descuento));
	return fromCents(unitario * linea.cantidad);
}

export interface VentaTotales {
	/** Suma de las líneas, ya con sus descuentos por unidad (lo que la API llama `subtotal`) */
	subtotal: number;
	/** Suma de los descuentos por unidad (informativo) */
	descuentoItems: number;
	/** Descuento global aplicado, nunca mayor que el subtotal */
	descuento: number;
	total: number;
	/** Cantidad de prendas */
	unidades: number;
}

export function calcularTotales(
	lineas: readonly CarritoLinea[],
	descuentoGlobal = 0,
	recalcular = false
): VentaTotales {
	let subtotal = 0;
	let descuentoItems = 0;
	let unidades = 0;
	for (const linea of lineas) {
		subtotal += toCents(calcularLinea(linea, recalcular));
		descuentoItems += toCents(parseMonto(linea.descuento_unitario) ?? 0) * linea.cantidad;
		unidades += linea.cantidad;
	}
	const descuento = Math.min(subtotal, Math.max(0, toCents(descuentoGlobal)));
	return {
		subtotal: fromCents(subtotal),
		descuentoItems: fromCents(descuentoItems),
		descuento: fromCents(descuento),
		total: fromCents(subtotal - descuento),
		unidades
	};
}

/** Cambio a devolver al cliente que paga en efectivo; null si paga con menos o no es un monto */
export function calcularCambio(total: number, pagaCon: string): number | null {
	const monto = parseMonto(pagaCon);
	if (monto === null || monto === 0 || toCents(monto) < toCents(total)) return null;
	return fromCents(toCents(monto) - toCents(total));
}

// ── Pagos ─────────────────────────────────────────────────────────────────────────────────────

/** Métodos de pago de la venta, sin repetir: los del listado o, en un detalle, los de sus pagos */
export function metodosDeVenta(venta: Venta | VentaDetalle): MetodoPago[] {
	if (venta.metodos_pago) return venta.metodos_pago;
	return 'pagos' in venta ? [...new Set(venta.pagos.map((pago) => pago.metodo))] : [];
}

/** La venta tal como la muestra el listado (p. ej. tras cobrarla o cancelarla desde él) */
export function ventaDesdeDetalle(detalle: VentaDetalle): Venta {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { items, pagos, ...venta } = detalle;
	return { ...venta, metodos_pago: metodosDeVenta(detalle) };
}

/** Métodos de pago en texto, sin repetir y en orden: "QR + Efectivo" */
export function metodosPagoTexto(metodos: readonly MetodoPago[]): string | null {
	const unicos = [...new Set(metodos)];
	return unicos.length ? unicos.map((metodo) => METODO_PAGO_LABEL[metodo]).join(' + ') : null;
}

export interface CobroPorMetodo {
	metodo: MetodoPago;
	monto: number;
	/** Proporción sobre el total cobrado (0–1) */
	parte: number;
}

/** Desglose de lo cobrado por método, de mayor a menor y sin los métodos en cero */
export function desgloseCobrado(confirmada: VentaResumen['confirmada']): CobroPorMetodo[] {
	const total = confirmada.total;
	return Object.values(METODO_PAGO)
		.map((metodo) => {
			const monto = confirmada[metodo.toLowerCase() as Lowercase<MetodoPago>] ?? 0;
			return { metodo, monto, parte: total > 0 ? monto / total : 0 };
		})
		.filter((item) => item.monto > 0)
		.sort((a, b) => b.monto - a.monto);
}

// ── Pagos de la caja ──────────────────────────────────────────────────────────────────────────

/** Pago vacío de la caja (el id solo identifica la fila en la lista) */
export function nuevoPago(metodo: MetodoPago | null = null, monto = ''): PagoLinea {
	const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
	return { id, metodo, monto, referencia: '' };
}

export interface EstadoPagos {
	/** Suma de los montos escritos (los inválidos cuentan 0) */
	asignado: number;
	/** Lo que falta para llegar al total (0 si ya se cubrió) */
	falta: number;
	/** Lo que se pasa del total (0 si no) */
	sobra: number;
}

/** Cuánto suman los pagos de un cobro dividido frente al total */
export function estadoPagos(pagos: readonly PagoLinea[], total: number): EstadoPagos {
	const asignado = pagos.reduce((sum, pago) => sum + toCents(parseMonto(pago.monto) ?? 0), 0);
	const diferencia = toCents(total) - asignado;
	return {
		asignado: fromCents(asignado),
		falta: fromCents(Math.max(0, diferencia)),
		sobra: fromCents(Math.max(0, -diferencia))
	};
}

// ── Carrito ───────────────────────────────────────────────────────────────────────────────────

export function lineaDesdeSku(sku: SkuInventario, cantidad = 1): CarritoLinea {
	return {
		sku_id: sku.id,
		producto_nombre: sku.producto_nombre,
		color_nombre: sku.color_nombre,
		color_codigo_hex: sku.color_codigo_hex,
		talla_etiqueta: sku.talla_etiqueta,
		codigo_barras: sku.codigo_barras,
		precio_normal: sku.precio.normal,
		precio_unitario: sku.precio_vigente,
		precio_actual: sku.precio_vigente,
		stock: sku.stock.cantidad,
		cantidad,
		descuento_unitario: ''
	};
}

export type AgregarResultado =
	| { ok: true; lineas: CarritoLinea[]; cantidad: number }
	| { ok: false; lineas: CarritoLinea[]; error: string };

/**
 * Agrega una unidad del SKU: suma a su línea si ya está en el carrito (al final de la lista, para que
 * lo último escaneado quede visible) o crea una nueva. Nunca supera el stock disponible.
 */
export function agregarAlCarrito(
	lineas: readonly CarritoLinea[],
	sku: SkuInventario
): AgregarResultado {
	const stock = sku.stock.cantidad;
	const existente = lineas.find((linea) => linea.sku_id === sku.id);
	const cantidad = (existente?.cantidad ?? 0) + 1;
	const nombre = `${sku.producto_nombre} (${sku.color_nombre}, ${sku.talla_etiqueta})`;

	if (stock <= 0) return { ok: false, lineas: [...lineas], error: `${nombre} está agotado.` };
	if (cantidad > stock) {
		return {
			ok: false,
			lineas: [...lineas],
			error: `Solo hay ${stock} ${stock === 1 ? 'unidad' : 'unidades'} de ${nombre}.`
		};
	}

	if (!existente) return { ok: true, lineas: [...lineas, lineaDesdeSku(sku)], cantidad };

	// Se refrescan el stock y el precio de hoy con lo último que respondió la API
	return {
		ok: true,
		cantidad,
		lineas: lineas.map((linea) =>
			linea.sku_id === sku.id
				? { ...linea, cantidad, stock, precio_actual: sku.precio_vigente }
				: linea
		)
	};
}

export interface LineaErrores {
	cantidad?: string;
	descuento?: string;
	/** Problema de la línea completa (p. ej. el SKU ya no existe) */
	linea?: string;
}

/** Errores de una línea; objeto vacío si es válida */
export function validarLinea(linea: CarritoLinea, recalcular = false): LineaErrores {
	const errores: LineaErrores = {};
	if (linea.eliminado) {
		errores.linea = 'Este producto ya no está en el catálogo. Quítalo para guardar la venta.';
	}

	if (!Number.isInteger(linea.cantidad) || linea.cantidad < 1) {
		errores.cantidad = 'La cantidad debe ser un número entero mayor que 0.';
	} else if (linea.stock !== null && linea.cantidad > linea.stock) {
		errores.cantidad =
			linea.stock <= 0
				? 'Sin stock disponible.'
				: `Solo hay ${linea.stock} ${linea.stock === 1 ? 'unidad' : 'unidades'} en stock.`;
	}

	const descuento = parseMonto(linea.descuento_unitario);
	if (descuento === null) {
		errores.descuento = 'Ingresa un monto válido, con hasta 2 decimales.';
	} else if (toCents(descuento) > toCents(precioLinea(linea, recalcular))) {
		errores.descuento = `El descuento no puede superar el precio (${formatCurrency(precioLinea(linea, recalcular))}).`;
	}
	return errores;
}

export const tieneErrores = (errores: LineaErrores): boolean => Object.keys(errores).length > 0;

export function toItemsRequest(lineas: readonly CarritoLinea[]): VentaItemRequest[] {
	return lineas.map((linea) => ({
		sku_id: linea.sku_id,
		cantidad: linea.cantidad,
		descuento_unitario: parseMonto(linea.descuento_unitario) ?? 0
	}));
}

/**
 * Líneas para editar un pedido guardado. Conservan el precio con que se ofrecieron; `skus` (el
 * inventario de hoy) aporta el stock y el precio actual. Un ítem sin SKU en el inventario se marca
 * como eliminado del catálogo.
 */
export function lineasDesdeVenta(
	venta: VentaDetalle,
	skus: readonly SkuInventario[]
): CarritoLinea[] {
	const porId = new Map(skus.map((sku) => [sku.id, sku]));
	return venta.items.map((item) => {
		const sku = porId.get(item.sku_id);
		return {
			sku_id: item.sku_id,
			producto_nombre: item.producto_nombre,
			color_nombre: item.color_nombre,
			color_codigo_hex: sku?.color_codigo_hex ?? null,
			talla_etiqueta: item.talla_etiqueta,
			codigo_barras: item.codigo_barras,
			precio_normal: item.precio_normal,
			precio_unitario: item.precio_unitario,
			precio_actual: sku?.precio_vigente ?? null,
			stock: sku?.stock.cantidad ?? null,
			cantidad: item.cantidad,
			descuento_unitario: item.descuento_unitario ? String(item.descuento_unitario) : '',
			...(!sku && { eliminado: true })
		};
	});
}

/**
 * Refresca el stock y el precio de hoy de las líneas con el inventario recién consultado. No toca el
 * precio que se cobra: en un pedido guardado se conserva el ofrecido.
 */
export function sincronizarLineas(
	lineas: readonly CarritoLinea[],
	skus: readonly SkuInventario[]
): CarritoLinea[] {
	const porId = new Map(skus.map((sku) => [sku.id, sku]));
	let cambio = false;
	const result = lineas.map((linea) => {
		const sku = porId.get(linea.sku_id);
		if (!sku) return linea;
		if (linea.stock === sku.stock.cantidad && linea.precio_actual === sku.precio_vigente) {
			return linea;
		}
		cambio = true;
		return { ...linea, stock: sku.stock.cantidad, precio_actual: sku.precio_vigente };
	});
	return cambio ? result : [...lineas];
}

/** true si la línea tiene hoy un precio distinto al ofrecido (no se sabe si salió del catálogo) */
export function precioCambio(linea: CarritoLinea): boolean {
	return (
		linea.precio_actual !== null && toCents(linea.precio_actual) !== toCents(linea.precio_unitario)
	);
}

/** true si alguna línea tiene hoy un precio distinto al ofrecido */
export function hayPreciosDistintos(lineas: readonly CarritoLinea[]): boolean {
	return lineas.some(precioCambio);
}

export interface ComparacionPrecios {
	/** Líneas cuyo precio de hoy difiere del ofrecido */
	cambiadas: number;
	/** Total con los precios con que se ofreció el pedido */
	totalOfrecido: number;
	/** Total con los precios de hoy */
	totalHoy: number;
}

/** Total del pedido con los precios ofrecidos frente al total con los de hoy */
export function compararPrecios(
	lineas: readonly CarritoLinea[],
	descuentoGlobal = 0
): ComparacionPrecios {
	return {
		cambiadas: lineas.filter(precioCambio).length,
		totalOfrecido: calcularTotales(lineas, descuentoGlobal, false).total,
		totalHoy: calcularTotales(lineas, descuentoGlobal, true).total
	};
}

// ── Catálogo de la caja ───────────────────────────────────────────────────────────────────────

export interface InventarioColor {
	color_id: string;
	color_nombre: string;
	color_codigo_hex: string;
	skus: SkuInventario[];
}

export interface InventarioProducto {
	producto_id: string;
	producto_nombre: string;
	colores: InventarioColor[];
}

/** Agrupa los SKUs por producto y color, en el orden en que llegan (la API ordena por producto, color y talla) */
export function agruparInventario(skus: readonly SkuInventario[]): InventarioProducto[] {
	const productos = new Map<string, InventarioProducto>();
	const colores = new Map<string, InventarioColor>();
	for (const sku of skus) {
		let producto = productos.get(sku.producto_id);
		if (!producto) {
			producto = {
				producto_id: sku.producto_id,
				producto_nombre: sku.producto_nombre,
				colores: []
			};
			productos.set(sku.producto_id, producto);
		}
		const colorKey = `${sku.producto_id}:${sku.color_id}`;
		let color = colores.get(colorKey);
		if (!color) {
			color = {
				color_id: sku.color_id,
				color_nombre: sku.color_nombre,
				color_codigo_hex: sku.color_codigo_hex,
				skus: []
			};
			colores.set(colorKey, color);
			producto.colores.push(color);
		}
		color.skus.push(sku);
	}
	return [...productos.values()];
}

// ── Búsqueda en la caja ───────────────────────────────────────────────────────────────────────

/** Pausa al escribir antes de buscar. Un lector USB escribe el código entero en mucho menos */
export const BUSQUEDA_DEBOUNCE_MS = 300;
/** Caracteres mínimos para buscar por nombre */
export const BUSQUEDA_MIN_CHARS = 2;

// Un lector de códigos escribe un código sin espacios (EAN-13, UPC, o uno interno con letras)
const CODIGO_BARRAS_REGEX = /^[0-9A-Za-z\-.]{6,50}$/;

/** El texto parece un código de barras (sin espacios y con dígitos) y no un nombre */
export function esCodigoBarras(texto: string): boolean {
	const value = texto.trim();
	return CODIGO_BARRAS_REGEX.test(value) && /\d/.test(value);
}

export interface EstadoStockSku {
	/** Unidades que aún se pueden agregar (stock menos lo que ya está en el carrito) */
	restantes: number;
	texto: string;
	/** No se puede agregar más */
	agotado: boolean;
	/** Stock en o bajo el mínimo */
	bajo: boolean;
}

/** Disponibilidad de un SKU descontando lo que ya está en el carrito */
export function estadoStockSku(sku: SkuInventario, enCarrito = 0): EstadoStockSku {
	const cantidad = sku.stock.cantidad;
	const restantes = Math.max(0, cantidad - enCarrito);
	if (cantidad <= 0) return { restantes: 0, texto: 'Agotado', agotado: true, bajo: false };
	if (restantes === 0) return { restantes, texto: 'Todo en carrito', agotado: true, bajo: false };
	return {
		restantes,
		texto: `${restantes} disp.`,
		agotado: false,
		bajo: cantidad <= sku.stock.minimo
	};
}

// ── WhatsApp ──────────────────────────────────────────────────────────────────────────────────

/** Código de país que se antepone a un número local de 8 dígitos (Bolivia) */
const CODIGO_PAIS = '591';

/** Número para wa.me: solo dígitos y con código de país; null si no parece un teléfono */
export function normalizarTelefonoWhatsapp(telefono: string | null | undefined): string | null {
	const digitos = (telefono ?? '').replace(/\D/g, '');
	if (digitos.length < 7) return null;
	// Número local boliviano (móvil 6/7 o fijo 2/3/4): 8 dígitos sin código de país
	if (digitos.length === 8) return `${CODIGO_PAIS}${digitos}`;
	return digitos;
}

/** Texto del pedido para enviarlo al cliente por WhatsApp */
export function mensajeWhatsappVenta(venta: VentaDetalle, tiendaNombre?: string | null): string {
	const esPedido = venta.estado === VENTA_ESTADO.PENDIENTE;
	const metodos = metodosPagoTexto(metodosDeVenta(venta));
	const lineas = [
		tiendaNombre ? `*${tiendaNombre}*` : null,
		`${esPedido ? 'Pedido' : 'Venta'} ${formatVentaNumero(venta.numero)}`,
		venta.referencia ? `Cliente: ${venta.referencia}` : null,
		'',
		...venta.items.map(
			(item) =>
				`• ${item.cantidad} × ${item.producto_nombre} (${item.color_nombre}, talla ${item.talla_etiqueta}) — ${formatCurrency(item.subtotal)}`
		),
		'',
		venta.descuento > 0 ? `Subtotal: ${formatCurrency(venta.subtotal)}` : null,
		venta.descuento > 0 ? `Descuento: −${formatCurrency(venta.descuento)}` : null,
		`*Total: ${formatCurrency(venta.total)}*`,
		metodos ? `Pago: ${metodos}` : null,
		venta.nota ? `Nota: ${venta.nota}` : null,
		'',
		esPedido ? '¡Gracias por tu pedido!' : '¡Gracias por tu compra!'
	];
	return lineas
		.filter((linea): linea is string => linea !== null)
		.join('\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

/** Enlace wa.me con el mensaje; sin teléfono válido WhatsApp deja elegir el contacto */
export function buildWhatsappUrl(venta: VentaDetalle, tiendaNombre?: string | null): string {
	const telefono = normalizarTelefonoWhatsapp(venta.cliente_telefono);
	const texto = encodeURIComponent(mensajeWhatsappVenta(venta, tiendaNombre));
	return `https://wa.me/${telefono ?? ''}?text=${texto}`;
}

// ── Filtros de fecha del historial ────────────────────────────────────────────────────────────

/** Suma días a una fecha YYYY-MM-DD (en UTC para no saltar días por el horario de verano) */
export function addDaysISO(date: string, days: number): string {
	const [year, month, day] = date.split('-').map(Number);
	const result = new Date(Date.UTC(year, month - 1, day + days));
	return result.toISOString().slice(0, 10);
}

/** `desde`/`hasta` (incluidos) de un rango; PERSONALIZADO y TODO no fijan fechas */
export function rangoFechas(
	rango: RangoFecha,
	today: string = todayISO()
): { desde?: string; hasta?: string } {
	switch (rango) {
		case RANGO_FECHA.HOY:
			return { desde: today, hasta: today };
		case RANGO_FECHA.AYER: {
			const ayer = addDaysISO(today, -1);
			return { desde: ayer, hasta: ayer };
		}
		case RANGO_FECHA.SIETE_DIAS:
			return { desde: addDaysISO(today, -6), hasta: today };
		case RANGO_FECHA.MES:
			return { desde: `${today.slice(0, 8)}01`, hasta: today };
		default:
			return {};
	}
}

/** Parámetros de `GET /ventas/` para los filtros elegidos (sin paginación) */
export function ventaFiltrosToParams(
	filtros: VentaFiltros,
	today: string = todayISO()
): Omit<ListVentasParams, 'page' | 'per_page'> {
	const fechas =
		filtros.rango === RANGO_FECHA.PERSONALIZADO
			? { desde: filtros.desde || undefined, hasta: filtros.hasta || undefined }
			: rangoFechas(filtros.rango, today);
	const numero = Number.parseInt(filtros.numero.replace(/\D/g, ''), 10);
	return {
		...fechas,
		estado: filtros.estado ?? undefined,
		canal: filtros.canal ?? undefined,
		metodo_pago: filtros.metodo_pago ?? undefined,
		created_by: filtros.created_by ?? undefined,
		numero: Number.isInteger(numero) && numero >= 1 ? numero : undefined
	};
}

// ── Borrador de la caja ───────────────────────────────────────────────────────────────────────

function esBorrador(value: unknown): value is VentaBorrador {
	if (typeof value !== 'object' || value === null) return false;
	const borrador = value as Partial<VentaBorrador>;
	return (
		Array.isArray(borrador.lineas) &&
		typeof borrador.checkout === 'object' &&
		borrador.checkout !== null &&
		borrador.lineas.every(
			(linea) =>
				typeof linea?.sku_id === 'string' &&
				typeof linea.cantidad === 'number' &&
				typeof linea.precio_unitario === 'number'
		)
	);
}

/** Venta en curso guardada; null si no hay o no se puede leer (modo privado, datos corruptos) */
export function leerBorradorVenta(): VentaBorrador | null {
	try {
		const raw = localStorage.getItem(VENTA_BORRADOR_KEY);
		if (!raw) return null;
		const value: unknown = JSON.parse(raw);
		return esBorrador(value) && value.lineas.length > 0 ? value : null;
	} catch {
		return null;
	}
}

export function guardarBorradorVenta(borrador: Omit<VentaBorrador, 'guardado_at'>): void {
	try {
		if (borrador.lineas.length === 0) {
			localStorage.removeItem(VENTA_BORRADOR_KEY);
			return;
		}
		const value: VentaBorrador = { ...borrador, guardado_at: new Date().toISOString() };
		localStorage.setItem(VENTA_BORRADOR_KEY, JSON.stringify(value));
	} catch {
		// Sin almacenamiento disponible la caja sigue funcionando, solo no se recupera al recargar
	}
}

export function borrarBorradorVenta(): void {
	try {
		localStorage.removeItem(VENTA_BORRADOR_KEY);
	} catch {
		// Nada que limpiar
	}
}
