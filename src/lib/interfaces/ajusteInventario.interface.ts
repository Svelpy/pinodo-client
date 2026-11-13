import type { AjusteMotivo, RangoFecha } from '#lib/constants/index.ts';
import type { MovimientoInventario } from './kardex.interface';
import type { PaginationParams } from './pagination.interface';

// ── Ajustes de inventario (`/ajustes-inventario/`) ───────────────────────────────────────────────

/** Motivos que se registran a mano: INICIAL solo lo genera el sistema al crear SKUs con stock */
export type AjusteMotivoManual = Exclude<AjusteMotivo, 'INICIAL'>;

/**
 * Un SKU del ajuste. Qué campos lleva depende del motivo:
 * - RECEPCION: `cantidad` (> 0, entra) y `costo_unitario` (recalcula el costo promedio).
 * - CONTEO: `cantidad_contada` (≥ 0, lo que hay en el estante); se registra la diferencia.
 * - MERMA y ROBO_PERDIDA: `cantidad` (> 0, las unidades que salen).
 * - CORRECCION: `cantidad` positiva (entra) o negativa (sale), distinta de 0.
 */
export interface AjusteInventarioItemRequest {
	sku_id: string;
	cantidad?: number;
	cantidad_contada?: number;
	costo_unitario?: number;
}

/**
 * `POST /ajustes-inventario/`: uno o varios SKUs con un mismo motivo, en una sola transacción (a
 * todos o a ninguno). `nota` es obligatoria en CORRECCION. 422 si un SKU no existe; 409 con
 * `stock_actual` en `details` si algún stock quedaría negativo.
 */
export interface CreateAjusteInventarioRequest {
	motivo: AjusteMotivoManual;
	/** Se omite si no hay (máx. 200 caracteres) */
	nota?: string;
	items: AjusteInventarioItemRequest[];
}

/** Documento de ajuste (Ajuste #N). No se edita ni se elimina: un error se corrige con otro */
export interface AjusteInventario {
	id: string;
	numero: number;
	motivo: AjusteMotivo;
	nota: string | null;
	/** Cuántos SKUs movió */
	items: number;
	/** Suma de las cantidades (negativa si salió más de lo que entró) */
	unidades: number;
	/** Suma de cantidad × costo_unitario */
	valor: number;
	created_at: string;
	/** null en la carga inicial */
	created_by: string | null;
}

/** El documento con sus líneas: los movimientos del kardex que registró */
export interface AjusteInventarioDetalle extends AjusteInventario {
	movimientos: MovimientoInventario[];
}

/**
 * Respuesta de `POST /ajustes-inventario/`. En un CONTEO, los SKUs que ya cuadraban vuelven en
 * `sin_diferencia` (sin línea), y si ninguno cambió no se crea documento: `ajuste` es null.
 */
export interface AjusteInventarioResultado {
	ajuste: AjusteInventarioDetalle | null;
	sin_diferencia: string[];
}

/** `GET /ajustes-inventario/`: del más reciente al más antiguo, incluida la carga INICIAL */
export interface ListAjustesParams extends PaginationParams {
	motivo?: AjusteMotivo;
	/** Quien lo registró */
	created_by?: string;
	/** Fecha de la tienda YYYY-MM-DD, incluida */
	desde?: string;
	/** Fecha de la tienda YYYY-MM-DD, incluida */
	hasta?: string;
}

/** Filtros del listado de ajustes, tal como los elige el usuario */
export interface AjusteFiltros {
	rango: RangoFecha;
	/** Solo con rango PERSONALIZADO (YYYY-MM-DD) */
	desde: string;
	hasta: string;
	motivo: AjusteMotivo | null;
	created_by: string | null;
}
