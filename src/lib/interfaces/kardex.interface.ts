import type { MovimientoTipo, RangoFecha } from '#lib/constants/index.ts';
import type { PaginationParams } from './pagination.interface';
import type { ProductoPrecio, ProductoStock } from './producto.interface';
import type { Venta } from './venta.interface';

// ── Kardex (`/movimientos-inventario/`) ───────────────────────────────────────────────────────

/** SKU tal como viene en un movimiento: sin nombres de producto, color ni talla */
export interface MovimientoSku {
	id: string;
	producto_color_id: string;
	talla_id: string;
	codigo_barras: string | null;
	is_visible: boolean;
	precio: ProductoPrecio;
	/** Stock de hoy, no el que dejó el movimiento (ese es `saldo`) */
	stock: ProductoStock;
	created_at: string;
	updated_at: string;
}

/** Un movimiento de inventario: cada entrada o salida de stock de un SKU */
export interface MovimientoInventario {
	id: string;
	sku_id: string;
	tipo: MovimientoTipo;
	/** Positivo entra, negativo sale */
	cantidad: number;
	/** Stock del SKU que dejó este movimiento */
	saldo: number;
	/** Costo por unidad del movimiento */
	costo_unitario: number | null;
	/** Costo promedio del SKU después del movimiento */
	costo_promedio: number | null;
	motivo: string | null;
	venta_id: string | null;
	created_at: string;
	/** Id del usuario que lo originó */
	created_by: string | null;
	sku: MovimientoSku | null;
	/** Venta que lo originó (VENTA y ANULACION) */
	venta: Venta | null;
}

export interface ListMovimientosParams extends PaginationParams {
	/** Con un SKU es su kardex */
	sku_id?: string;
	tipo?: MovimientoTipo;
	venta_id?: string;
	created_by?: string;
	/** Fecha de la tienda YYYY-MM-DD, incluida */
	desde?: string;
	/** Fecha de la tienda YYYY-MM-DD, incluida */
	hasta?: string;
}

/** Stock, costo promedio y valor de un SKU activo (`GET /movimientos-inventario/costos`) */
export interface CostoSku {
	sku_id: string;
	producto_id: string;
	producto_nombre: string;
	color_nombre: string;
	talla_etiqueta: string;
	codigo_barras: string | null;
	cantidad: number;
	/** Costo promedio por unidad */
	costo: number | null;
	/** cantidad × costo */
	valor: number | null;
}

export interface ListCostosParams extends PaginationParams {
	/** Coincidencias parciales en el nombre del producto; máx. 200 caracteres */
	nombre?: string;
	/** Coincidencia exacta; máx. 50 caracteres */
	codigo_barras?: string;
	producto_id?: string;
	color_id?: string;
}

/** Nombre de un SKU para mostrarlo (los movimientos solo traen su id) */
export interface SkuNombre {
	producto_id: string;
	producto_nombre: string;
	color_nombre: string;
	/** null si no se conoce (p. ej. el SKU vino de los costos) */
	color_codigo_hex: string | null;
	talla_etiqueta: string;
	codigo_barras: string | null;
}

/** Filtros del kardex, tal como los elige el usuario */
export interface KardexFiltros {
	rango: RangoFecha;
	/** Solo con rango PERSONALIZADO (YYYY-MM-DD) */
	desde: string;
	hasta: string;
	tipo: MovimientoTipo | null;
	created_by: string | null;
	/** Kardex de un solo SKU */
	sku_id: string | null;
}

/** Filtros del valor del stock, tal como los escribe el usuario */
export interface CostoFiltros {
	nombre: string;
	codigo_barras: string;
}
