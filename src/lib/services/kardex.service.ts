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
	 * Del más reciente al más antiguo. Con `sku_id` es el kardex de ese SKU (`saldo` es el stock que
	 * dejó cada movimiento). `desde` y `hasta` son fechas de la tienda, ambas incluidas.
	 */
	async list({
		sku_id,
		tipo,
		venta_id,
		created_by,
		desde,
		hasta,
		...pagination
	}: ListMovimientosParams = {}): Promise<PaginatedResponse<MovimientoInventario>> {
		const query = buildPaginationQuery(pagination);
		if (sku_id) query.set('sku_id', sku_id);
		if (tipo) query.set('tipo', tipo);
		if (venta_id) query.set('venta_id', venta_id);
		if (created_by) query.set('created_by', created_by);
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
