import { MOVIMIENTO_TIPO, RANGO_FECHA } from '#lib/constants/index.ts';
import type {
	AjusteFiltros,
	CostoSku,
	KardexFiltros,
	ListAjustesParams,
	ListMovimientosParams,
	MovimientoOrigen,
	SkuNombre
} from '#lib/interfaces/index.ts';
import { todayISO } from './date';
import { formatVentaNumero } from './format';
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
		// El motivo es de los ajustes: con otro tipo no hay nada que filtrar
		motivo: admiteMotivo(filtros.tipo) ? (filtros.motivo ?? undefined) : undefined,
		user_id: filtros.user_id ?? undefined,
		sku_id: filtros.sku_id ?? undefined
	};
}

/** Parámetros de `GET /ajustes-inventario/` para los filtros elegidos (sin paginación) */
export function ajusteFiltrosToParams(
	filtros: AjusteFiltros,
	today: string = todayISO()
): Omit<ListAjustesParams, 'page' | 'per_page'> {
	const fechas =
		filtros.rango === RANGO_FECHA.PERSONALIZADO
			? { desde: filtros.desde || undefined, hasta: filtros.hasta || undefined }
			: rangoFechas(filtros.rango, today);
	return {
		...fechas,
		motivo: filtros.motivo ?? undefined,
		created_by: filtros.created_by ?? undefined
	};
}

/** El filtro de motivo solo tiene sentido con todos los tipos o con ajustes */
export function admiteMotivo(tipo: KardexFiltros['tipo']): boolean {
	return tipo === null || tipo === MOVIMIENTO_TIPO.AJUSTE;
}

/** Documento que causó el movimiento: "Ajuste #12" o "Venta #000009" */
export function formatOrigen(origen: Pick<MovimientoOrigen, 'tipo' | 'numero'>): string {
	return origen.tipo === 'VENTA'
		? `Venta ${formatVentaNumero(origen.numero)}`
		: `Ajuste #${origen.numero}`;
}

/** Nombre de un SKU de la consulta de costos */
export function skuNombreDesdeCosto(costo: CostoSku): SkuNombre {
	return {
		producto_id: costo.producto_id,
		producto_nombre: costo.producto_nombre,
		color_nombre: costo.color_nombre,
		talla_etiqueta: costo.talla_etiqueta,
		codigo_barras: costo.codigo_barras
	};
}

/** "Azul marino · M" */
export function varianteSku(sku: Pick<SkuNombre, 'color_nombre' | 'talla_etiqueta'>): string {
	return `${sku.color_nombre} · ${sku.talla_etiqueta}`;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** true si es un UUID (p. ej. el `?sku=` de la URL, antes de enviarlo a la API) */
export function esUuid(value: string | null | undefined): value is string {
	return !!value && UUID_REGEX.test(value);
}
