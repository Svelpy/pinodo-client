import { apiPinodo } from '#lib/config/index.ts';
import type {
	ConfirmarVentaRequest,
	CreateVentaRequest,
	ListVentasParams,
	ReplaceVentaItemsRequest,
	VentaDetalle,
	VentasListResponse
} from '#lib/interfaces/index.ts';
import { buildPaginationQuery } from '#lib/utils/index.ts';

/**
 * Ventas (`/ventas/`). Un CAJERO solo accede a las ventas que registró: las demás responden 404.
 */
class VentaService {
	/**
	 * De la más reciente a la más antigua. `resumen` suma todas las ventas filtradas (no solo las de
	 * la página) e ignora los filtros `estado` y `metodo_pago`.
	 */
	async list({
		estado,
		canal,
		metodo_pago,
		created_by,
		numero,
		desde,
		hasta,
		...pagination
	}: ListVentasParams = {}): Promise<VentasListResponse> {
		const query = buildPaginationQuery(pagination);
		if (estado) query.set('estado', estado);
		if (canal) query.set('canal', canal);
		if (metodo_pago) query.set('metodo_pago', metodo_pago);
		if (created_by) query.set('created_by', created_by);
		if (numero && numero >= 1) query.set('numero', String(Math.trunc(numero)));
		if (desde) query.set('desde', desde);
		if (hasta) query.set('hasta', hasta);
		return apiPinodo.get<VentasListResponse>(`/ventas/?${query}`, { requireAuth: true });
	}

	/** Con sus ítems */
	async get(id: string): Promise<VentaDetalle> {
		return apiPinodo.get<VentaDetalle>(`/ventas/${id}`, { requireAuth: true });
	}

	/**
	 * Registra la venta. Sin pagos queda PENDIENTE; con pagos (que deben sumar exactamente el total)
	 * queda CONFIRMADA y descuenta el stock. 409 si no alcanza el stock o los pagos no suman el total.
	 */
	async create(data: CreateVentaRequest): Promise<VentaDetalle> {
		return apiPinodo.post<VentaDetalle>('/ventas/', data, { requireAuth: true });
	}

	/**
	 * Solo PENDIENTE. `items` reemplaza la lista completa; los demás campos solo cambian si se envían.
	 * 422 si un SKU ya no existe o un descuento no cabe al recalcular precios.
	 */
	async replaceItems(id: string, data: ReplaceVentaItemsRequest): Promise<VentaDetalle> {
		return apiPinodo.put<VentaDetalle>(`/ventas/${id}/items`, data, { requireAuth: true });
	}

	/**
	 * Cobra un pedido PENDIENTE y descuenta el stock. Los pagos deben sumar exactamente el total
	 * (con `recalcular_precios`, el de hoy). 409 si no suman, no alcanza el stock o ya no está pendiente.
	 */
	async confirmar(
		id: string,
		{ pagos, recalcular_precios }: ConfirmarVentaRequest
	): Promise<VentaDetalle> {
		const body = recalcular_precios ? { pagos, recalcular_precios: true } : { pagos };
		return apiPinodo.post<VentaDetalle>(`/ventas/${id}/confirmar`, body, { requireAuth: true });
	}

	/**
	 * Anula la venta. Si estaba cobrada devuelve el stock y los pagos (exige permiso para anular
	 * cobradas). 409 si ya estaba cancelada.
	 */
	async cancelar(id: string): Promise<VentaDetalle> {
		return apiPinodo.post<VentaDetalle>(`/ventas/${id}/cancelar`, undefined, { requireAuth: true });
	}
}

export const ventaService = new VentaService();
