import type { Role } from '#lib/config/permissions.config.ts';
import type { AjusteMotivo, MovimientoTipo, RangoFecha } from '#lib/constants/index.ts';
import type { PaginationParams } from './pagination.interface';

// ── Kardex (`/movimientos-inventario/`) ───────────────────────────────────────────────────────

/**
 * La prenda de un movimiento, lista para mostrar. La API la resuelve aunque el SKU, su color o su
 * producto estén eliminados. No trae precio ni stock: el stock de hoy no es el saldo del movimiento.
 */
export interface MovimientoSku {
	id: string;
	codigo_barras: string | null;
	producto_id: string;
	producto_nombre: string;
	color_nombre: string;
	talla_etiqueta: string;
}

/**
 * Documento que causó el movimiento: "Ajuste #12" o "Venta #9". Una VENTA y su ANULACION apuntan a
 * la misma venta.
 */
export interface MovimientoOrigen {
	tipo: 'AJUSTE' | 'VENTA';
	id: string;
	numero: number;
	/** Motivo del ajuste; null en una venta */
	motivo: AjusteMotivo | null;
}

/** Usuario responsable del movimiento (se resuelve aunque esté eliminado) */
export interface MovimientoUsuario {
	id: string;
	nombre: string;
	apellidos: string | null;
	rol: Role;
}

/** Una fila del kardex valorizado */
export interface MovimientoInventario {
	id: string;
	tipo: MovimientoTipo;
	/** Positivo entra, negativo sale */
	cantidad: number;
	/** Stock del SKU que dejó este movimiento */
	saldo: number;
	/** Costo por unidad del movimiento */
	costo_unitario: number;
	/** cantidad × costo_unitario (negativo si sale) */
	costo_total: number;
	/** Costo promedio del SKU después del movimiento */
	costo_promedio: number;
	/** saldo × costo_promedio */
	saldo_valor: number;
	created_at: string;
	/** Auditoría; el responsable es `usuario` */
	created_by: string | null;
	sku: MovimientoSku;
	origen: MovimientoOrigen;
	usuario: MovimientoUsuario;
}

export interface ListMovimientosParams extends PaginationParams {
	/** Con un SKU es su kardex */
	sku_id?: string;
	tipo?: MovimientoTipo;
	/** Motivo del ajuste */
	motivo?: AjusteMotivo;
	ajuste_id?: string;
	venta_id?: string;
	/** Usuario responsable */
	user_id?: string;
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

/** Producto, color y talla de un SKU para mostrarlo (de un movimiento, los costos o el inventario) */
export type SkuNombre = Omit<MovimientoSku, 'id'>;

/** Filtros del kardex, tal como los elige el usuario */
export interface KardexFiltros {
	rango: RangoFecha;
	/** Solo con rango PERSONALIZADO (YYYY-MM-DD) */
	desde: string;
	hasta: string;
	tipo: MovimientoTipo | null;
	/** Solo aplica a los ajustes */
	motivo: AjusteMotivo | null;
	/** Usuario responsable */
	user_id: string | null;
	/** Kardex de un solo SKU */
	sku_id: string | null;
}

/** Filtros del valor del stock, tal como los escribe el usuario */
export interface CostoFiltros {
	nombre: string;
	codigo_barras: string;
}
