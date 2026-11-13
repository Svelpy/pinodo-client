import { RANGO_FECHA } from '#lib/constants/index.ts';
import type {
	CostoSku,
	KardexFiltros,
	ListMovimientosParams,
	SkuInventario,
	SkuNombre
} from '#lib/interfaces/index.ts';
import { todayISO } from './date';
import { rangoFechas } from './venta.utils';

/** Parámetros de `GET /movimientos-inventario/` para los filtros elegidos (sin paginación) */
export function kardexFiltrosToParams(
	filtros: KardexFiltros,
	today: string = todayISO()
): Omit<ListMovimientosParams, 'page' | 'per_page'> {
	const fechas =
		filtros.rango === RANGO_FECHA.PERSONALIZADO
			? { desde: filtros.desde || undefined, hasta: filtros.hasta || undefined }
			: rangoFechas(filtros.rango, today);
	return {
		...fechas,
		tipo: filtros.tipo ?? undefined,
		created_by: filtros.created_by ?? undefined,
		sku_id: filtros.sku_id ?? undefined
	};
}

/** Nombre de un SKU del inventario */
export function skuNombreDesdeInventario(sku: SkuInventario): SkuNombre {
	return {
		producto_id: sku.producto_id,
		producto_nombre: sku.producto_nombre,
		color_nombre: sku.color_nombre,
		color_codigo_hex: sku.color_codigo_hex,
		talla_etiqueta: sku.talla_etiqueta,
		codigo_barras: sku.codigo_barras
	};
}

/** Nombre de un SKU de la consulta de costos (no trae el color en hex) */
export function skuNombreDesdeCosto(costo: CostoSku): SkuNombre {
	return {
		producto_id: costo.producto_id,
		producto_nombre: costo.producto_nombre,
		color_nombre: costo.color_nombre,
		color_codigo_hex: null,
		talla_etiqueta: costo.talla_etiqueta,
		codigo_barras: costo.codigo_barras
	};
}

/** "Azul marino · M" */
export function varianteSku(sku: Pick<SkuNombre, 'color_nombre' | 'talla_etiqueta'>): string {
	return `${sku.color_nombre} · ${sku.talla_etiqueta}`;
}

/**
 * Valor de un movimiento: unidades movidas × costo unitario. null si no tiene costo.
 * Va en céntimos para no arrastrar errores de coma flotante.
 */
export function valorMovimiento(movimiento: {
	cantidad: number;
	costo_unitario: number | null;
}): number | null {
	if (movimiento.costo_unitario === null || movimiento.costo_unitario === undefined) return null;
	return (Math.abs(movimiento.cantidad) * Math.round(movimiento.costo_unitario * 100)) / 100;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** true si es un UUID (p. ej. el `?sku=` de la URL, antes de enviarlo a la API) */
export function esUuid(value: string | null | undefined): value is string {
	return !!value && UUID_REGEX.test(value);
}
