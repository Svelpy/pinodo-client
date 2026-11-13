import { apiPinodo } from '#lib/config/index.ts';
import type {
	AjusteInventario,
	AjusteInventarioDetalle,
	AjusteInventarioResultado,
	CreateAjusteInventarioRequest,
	ListAjustesParams,
	PaginatedResponse
} from '#lib/interfaces/index.ts';
import { buildPaginationQuery } from '#lib/utils/index.ts';

/** Ajustes de inventario (`/ajustes-inventario/`): la única forma de mover el stock a mano */
class AjusteInventarioService {
	/**
	 * Documentos del más reciente al más antiguo, con sus totales (items, unidades y valor). Incluye la
	 * carga INICIAL de los SKUs nuevos. `desde` y `hasta` son fechas de la tienda, ambas incluidas.
	 */
	async list({ motivo, created_by, desde, hasta, ...pagination }: ListAjustesParams = {}): Promise<
		PaginatedResponse<AjusteInventario>
	> {
		const query = buildPaginationQuery(pagination);
		if (motivo) query.set('motivo', motivo);
		if (created_by) query.set('created_by', created_by);
		if (desde) query.set('desde', desde);
		if (hasta) query.set('hasta', hasta);
		return apiPinodo.get<PaginatedResponse<AjusteInventario>>(`/ajustes-inventario/?${query}`, {
			requireAuth: true
		});
	}

	/** El documento con sus líneas: los movimientos del kardex que registró */
	async get(id: string): Promise<AjusteInventarioDetalle> {
		return apiPinodo.get<AjusteInventarioDetalle>(`/ajustes-inventario/${id}`, {
			requireAuth: true
		});
	}

	/**
	 * Registra el ajuste de uno o varios SKUs (a todos o a ninguno). En un CONTEO sin diferencias no
	 * se crea documento (`ajuste: null`). 409 con `stock_actual` si algún stock quedaría negativo.
	 */
	async create(data: CreateAjusteInventarioRequest): Promise<AjusteInventarioResultado> {
		return apiPinodo.post<AjusteInventarioResultado>('/ajustes-inventario/', data, {
			requireAuth: true
		});
	}
}

export const ajusteInventarioService = new AjusteInventarioService();
