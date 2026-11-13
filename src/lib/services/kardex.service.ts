import { apiPinodo } from '#lib/config/index.ts';
import type {
	CostoSku,
	ListCostosParams,
	ListMovimientosParams,
	MovimientoInventario,
	PaginatedResponse
} from '#lib/interfaces/index.ts';
import { buildPaginationQuery } from '#lib/utils/index.ts';

/** Kardex: movimientos de inventario y costo del stock (`/movimientos-inventario/`) */
class KardexService {
	/**
	 * Kardex valorizado, del más reciente al más antiguo. Cada fila trae la prenda (`sku`), el
	 * documento que la causó (`origen`) y el usuario responsable. Con `sku_id` es el kardex de ese
	 * SKU. `motivo` filtra por el motivo del ajuste; `ajuste_id` y `venta_id`, por documento;
	 * `user_id`, por responsable. `desde` y `hasta` son fechas de la tienda, ambas incluidas.
	 */
	async list({
		sku_id,
		tipo,
		motivo,
		ajuste_id,
		venta_id,
		user_id,
		desde,
		hasta,
		...pagination
	}: ListMovimientosParams = {}): Promise<PaginatedResponse<MovimientoInventario>> {
		const query = buildPaginationQuery(pagination);
		if (sku_id) query.set('sku_id', sku_id);
		if (tipo) query.set('tipo', tipo);
		if (motivo) query.set('motivo', motivo);
		if (ajuste_id) query.set('ajuste_id', ajuste_id);
		if (venta_id) query.set('venta_id', venta_id);
		if (user_id) query.set('user_id', user_id);
		if (desde) query.set('desde', desde);
		if (hasta) query.set('hasta', hasta);
		return apiPinodo.get<PaginatedResponse<MovimientoInventario>>(
			`/movimientos-inventario/?${query}`,
			{ requireAuth: true }
		);
	}

	/**
	 * Stock, costo promedio y valor (cantidad × costo) de cada SKU activo. `nombre` busca coincidencias
	 * parciales en el producto; `codigo_barras`, la exacta. El costo se corrige editando el SKU.
	 */
	async costos({
		nombre,
		codigo_barras,
		producto_id,
		color_id,
		...pagination
	}: ListCostosParams = {}): Promise<PaginatedResponse<CostoSku>> {
		const query = buildPaginationQuery(pagination);
		const search = nombre?.trim();
		if (search) query.set('nombre', search);
		const codigo = codigo_barras?.trim();
		if (codigo) query.set('codigo_barras', codigo);
		if (producto_id) query.set('producto_id', producto_id);
		if (color_id) query.set('color_id', color_id);
		return apiPinodo.get<PaginatedResponse<CostoSku>>(`/movimientos-inventario/costos?${query}`, {
			requireAuth: true
		});
	}

	async get(id: string): Promise<MovimientoInventario> {
		return apiPinodo.get<MovimientoInventario>(`/movimientos-inventario/${id}`, {
			requireAuth: true
		});
	}
}

export const kardexService = new KardexService();
