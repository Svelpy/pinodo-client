import { apiPinodo } from '#lib/config/index.ts';
import type {
	AjustarStockRequest,
	ListInventarioParams,
	PaginatedResponse,
	ProductoSku,
	SkuInventario,
	SugerirCodigoBarrasResponse,
	UpdateSkuRequest
} from '#lib/interfaces/index.ts';
import { buildPaginationQuery } from '#lib/utils/index.ts';

/** SKUs (`/skus/`) */
class SkuService {
	/**
	 * SKUs activos con su producto, color, talla y `precio_vigente`, ordenados por producto, color y
	 * talla. `codigo_barras` es coincidencia exacta (escáner); `nombre`, parcial en el producto.
	 */
	async inventario({
		codigo_barras,
		nombre,
		producto_id,
		color_id,
		talla_id,
		is_visible,
		bajo_minimo,
		sin_codigo_barras,
		en_rebaja,
		...pagination
	}: ListInventarioParams = {}): Promise<PaginatedResponse<SkuInventario>> {
		const query = buildPaginationQuery(pagination);
		const codigo = codigo_barras?.trim();
		if (codigo) query.set('codigo_barras', codigo);
		const search = nombre?.trim();
		if (search) query.set('nombre', search);
		if (producto_id) query.set('producto_id', producto_id);
		if (color_id) query.set('color_id', color_id);
		if (talla_id) query.set('talla_id', talla_id);
		const flags = { is_visible, bajo_minimo, sin_codigo_barras, en_rebaja };
		for (const [key, value] of Object.entries(flags)) {
			if (value !== undefined) query.set(key, String(value));
		}
		return apiPinodo.get<PaginatedResponse<SkuInventario>>(`/skus/inventario?${query}`, {
			requireAuth: true
		});
	}

	/** Solo cambia lo enviado, también dentro de precio (`precio.rebajado: null` quita la rebaja) */
	async update(id: string, data: UpdateSkuRequest): Promise<ProductoSku> {
		return apiPinodo.patch<ProductoSku>(`/skus/${id}`, data, { requireAuth: true });
	}

	/**
	 * Suma `ajuste` (positivo entra, negativo sale) al stock actual, así nunca pisa lo que mueven las
	 * ventas, y/o cambia el `minimo`. 409 con `stock_actual` en `details` si quedaría negativo.
	 */
	async ajustarStock(id: string, data: AjustarStockRequest): Promise<ProductoSku> {
		return apiPinodo.patch<ProductoSku>(`/skus/${id}/stock`, data, { requireAuth: true });
	}

	/**
	 * EAN-13 de uso interno (prefijo GS1 20) que ningún SKU usa, ni eliminado. No lo reserva: se
	 * envía después como `codigo_barras` al crear o editar el SKU.
	 */
	async sugerirCodigoBarras(): Promise<SugerirCodigoBarrasResponse> {
		return apiPinodo.post<SugerirCodigoBarrasResponse>('/skus/sugerir-codigo-barras', undefined, {
			requireAuth: true
		});
	}
}

export const skuService = new SkuService();
