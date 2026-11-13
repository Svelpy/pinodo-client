import type { MetodoPago, RangoFecha, VentaCanal, VentaEstado } from '#lib/constants/index.ts';
import type { PaginatedResponse, PaginationParams } from './pagination.interface';
import type { ProductoPrecio, ProductoStock } from './producto.interface';

// ── Ventas (`/ventas/`) ───────────────────────────────────────────────────────────────────────

/**
 * Ítem de una venta. Precio y nombres son una copia (snapshot) del SKU al momento de venderlo:
 * no cambian aunque luego cambie el catálogo.
 */
export interface VentaItem {
	id: string;
	sku_id: string;
	cantidad: number;
	precio_normal: number;
	/** Precio cobrado por unidad antes del descuento del ítem (el rebajado si había rebaja) */
	precio_unitario: number;
	descuento_unitario: number;
	/** (precio_unitario − descuento_unitario) × cantidad */
	subtotal: number;
	producto_nombre: string;
	color_nombre: string;
	talla_etiqueta: string;
	codigo_barras: string | null;
}

/** Venta del listado (`GET /ventas/`), sin ítems */
export interface Venta {
	id: string;
	/** Correlativo de la tienda */
	numero: number;
	estado: VentaEstado;
	canal: VentaCanal;
	/** Nombre del cliente u otra referencia libre */
	referencia: string | null;
	cliente_telefono: string | null;
	/** Suma de los subtotales de los ítems */
	subtotal: number;
	/** Descuento global de la venta */
	descuento: number;
	total: number;
	/**
	 * Suma de los pagos: 0 en un pedido pendiente, el total en una venta cobrada y, al anular una
	 * venta cobrada, lo que se devolvió
	 */
	total_pagado: number;
	/** Métodos de sus pagos, sin repetir (vacío en un pedido pendiente) */
	metodos_pago: MetodoPago[];
	nota: string | null;
	confirmada_at: string | null;
	cancelada_at: string | null;
	created_at: string;
	/** Id del usuario que registró la venta */
	created_by: string;
	updated_at: string;
}

/** Pago de una venta: una venta puede cobrarse con varios métodos */
export interface VentaPago {
	id: string;
	venta_id: string;
	metodo: MetodoPago;
	monto: number;
	/** N.º de operación, recibo… */
	referencia: string | null;
	/** Foto del comprobante (QR, transferencia…) */
	comprobante_url: string | null;
	created_at: string;
	created_by: string;
	updated_at: string;
}

/**
 * Venta con sus ítems y pagos (`GET /ventas/{id}` y respuesta de crear, editar y cambiar estado)
 */
export interface VentaDetalle extends Omit<Venta, 'metodos_pago'> {
	/** El listado siempre lo trae; aquí se deduce de `pagos` si no viene (ver `metodosDeVenta`) */
	metodos_pago?: MetodoPago[];
	items: VentaItem[];
	pagos: VentaPago[];
}

/**
 * Totales de todas las ventas filtradas (no solo las de la página). Ignora los filtros de estado y
 * método de pago para mostrar siempre el desglose completo.
 */
export interface VentaResumen {
	/** Lo cobrado en las confirmadas, por método de pago, y su total */
	confirmada: Record<Lowercase<MetodoPago>, number> & { total: number };
	pendiente: number;
	cancelada: number;
}

export interface VentasListResponse extends PaginatedResponse<Venta> {
	resumen: VentaResumen;
}

export interface ListVentasParams extends PaginationParams {
	estado?: VentaEstado;
	canal?: VentaCanal;
	metodo_pago?: MetodoPago;
	created_by?: string;
	numero?: number;
	/** Fecha de la tienda YYYY-MM-DD, incluida */
	desde?: string;
	/** Fecha de la tienda YYYY-MM-DD, incluida */
	hasta?: string;
}

export interface VentaItemRequest {
	sku_id: string;
	cantidad: number;
	descuento_unitario: number;
}

/** Un pago al registrar o confirmar una venta */
export interface VentaPagoRequest {
	metodo: MetodoPago;
	monto: number;
	/** N.º de operación, recibo…; se omite si no hay */
	referencia?: string;
}

/**
 * `POST /ventas/`: los precios y nombres se copian del SKU con la rebaja vigente hoy. El estado lo
 * deciden los pagos: sin pagos queda PENDIENTE (pedido sin cobrar, no toca el stock); con pagos
 * (pueden ser mixtos) queda CONFIRMADA y descuenta el stock. Los pagos deben sumar exactamente el
 * total, no hay anticipos: 409 si no, o si no alcanza el stock.
 */
export interface CreateVentaRequest {
	canal: VentaCanal;
	referencia: string | null;
	cliente_telefono: string | null;
	descuento: number;
	nota: string | null;
	items: VentaItemRequest[];
	pagos: VentaPagoRequest[];
}

/**
 * `PUT /ventas/{id}/items` (solo PENDIENTE): `items` reemplaza la lista completa. Los demás campos
 * solo cambian si se envían. Sin `recalcular_precios` los ítems que ya estaban conservan su precio.
 */
export interface ReplaceVentaItemsRequest {
	canal?: VentaCanal;
	referencia?: string | null;
	cliente_telefono?: string | null;
	descuento?: number;
	nota?: string | null;
	items: VentaItemRequest[];
	recalcular_precios?: boolean;
}

/**
 * `POST /ventas/{id}/confirmar` (solo PENDIENTE): cobra y descuenta el stock. Los pagos deben sumar
 * exactamente el total; con `recalcular_precios`, el total nuevo con los precios de hoy.
 */
export interface ConfirmarVentaRequest {
	pagos: VentaPagoRequest[];
	recalcular_precios?: boolean;
}

// ── Inventario de SKUs (`GET /skus/inventario`) ───────────────────────────────────────────────

/** SKU activo con su producto, color y talla, para buscar qué vender */
export interface SkuInventario {
	id: string;
	producto_color_id: string;
	talla_id: string;
	codigo_barras: string | null;
	is_visible: boolean;
	precio: ProductoPrecio;
	stock: ProductoStock;
	created_at: string;
	updated_at: string;
	/** El precio que se cobra hoy: el rebajado si está vigente, si no el normal */
	precio_vigente: number;
	producto_id: string;
	producto_nombre: string;
	color_id: string;
	color_nombre: string;
	color_codigo_hex: string;
	talla_etiqueta: string;
}

export interface ListInventarioParams extends PaginationParams {
	/** Coincidencia exacta (p. ej. desde un escáner); máx. 50 caracteres */
	codigo_barras?: string;
	/** Coincidencias parciales en el nombre del producto; máx. 200 caracteres */
	nombre?: string;
	producto_id?: string;
	color_id?: string;
	talla_id?: string;
	is_visible?: boolean;
	bajo_minimo?: boolean;
	sin_codigo_barras?: boolean;
	en_rebaja?: boolean;
}

// ── Caja: estado local del carrito ────────────────────────────────────────────────────────────

/** Una línea del carrito de la caja */
export interface CarritoLinea {
	sku_id: string;
	producto_nombre: string;
	color_nombre: string;
	color_codigo_hex: string | null;
	talla_etiqueta: string;
	codigo_barras: string | null;
	precio_normal: number;
	/** Precio por unidad que se cobra: el vigente hoy o, en un pedido ya guardado, el ofrecido */
	precio_unitario: number;
	/** Precio vigente hoy; null si no se pudo consultar (SKU fuera del catálogo) */
	precio_actual: number | null;
	/** Stock disponible; null si no se conoce */
	stock: number | null;
	cantidad: number;
	/** Descuento por unidad tal como lo escribe el usuario */
	descuento_unitario: string;
	/** En un pedido guardado: el SKU ya no está en el catálogo y hay que quitarlo */
	eliminado?: boolean;
}

/** Un pago de la caja, tal como lo escribe el usuario */
export interface PagoLinea {
	/** Id local, solo para identificar la fila */
	id: string;
	metodo: MetodoPago | null;
	/** Con un solo pago se ignora: ese pago cubre el total */
	monto: string;
	referencia: string;
}

/** Datos del cobro en la caja, tal como los escribe el usuario */
export interface VentaCheckoutValues {
	canal: VentaCanal;
	referencia: string;
	cliente_telefono: string;
	descuento: string;
	nota: string;
	/** Solo se envían al cobrar; un pedido se guarda sin pagos */
	pagos: PagoLinea[];
}

/** Borrador de la caja guardado en localStorage */
export interface VentaBorrador {
	lineas: CarritoLinea[];
	checkout: VentaCheckoutValues;
	guardado_at: string;
}

/** Mensaje breve de la caja tras escanear o agregar una prenda */
export interface CajaAviso {
	tipo: 'success' | 'error';
	texto: string;
}

/** Botón pulsado en la caja: cobrar ahora (CONFIRMADA) o guardar como pedido (PENDIENTE) */
export type CarritoAccion = 'cobrar' | 'pedido';

/** Filtros del historial de ventas, tal como los elige el usuario */
export interface VentaFiltros {
	rango: RangoFecha;
	/** Solo con rango PERSONALIZADO (YYYY-MM-DD) */
	desde: string;
	hasta: string;
	estado: VentaEstado | null;
	canal: VentaCanal | null;
	metodo_pago: MetodoPago | null;
	/** Número de venta escrito (texto) */
	numero: string;
	created_by: string | null;
}
