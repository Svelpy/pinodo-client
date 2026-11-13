import { apiPinodo } from '#lib/config/index.ts';
import type {
	ArchivoDescargado,
	FinanzasParams,
	ReporteRentabilidad,
	ReporteVentas
} from '#lib/interfaces/index.ts';

/** `?desde=…&hasta=…` (solo las fechas indicadas); vacío si no hay ninguna */
function rangoQuery({ desde, hasta }: FinanzasParams): string {
	const query = new URLSearchParams();
	if (desde) query.set('desde', desde);
	if (hasta) query.set('hasta', hasta);
	const text = query.toString();
	return text ? `?${text}` : '';
}

/**
 * Reportes de finanzas (`/finanzas/`). Solo ventas confirmadas, por fecha de confirmación;
 * `desde` y `hasta` son fechas de la tienda, ambas incluidas (sin ellas, toda la historia).
 */
class FinanzasService {
	/** Cuánto se vendió y cobró, por dónde, quién y cómo se pagó; una línea por prenda vendida */
	async ventas(params: FinanzasParams = {}): Promise<ReporteVentas> {
		return apiPinodo.get<ReporteVentas>(`/finanzas/ventas${rangoQuery(params)}`, {
			requireAuth: true
		});
	}

	/** El reporte de ventas como .xlsx (hojas Resumen y Detalle) */
	async ventasExcel(params: FinanzasParams = {}): Promise<ArchivoDescargado> {
		return apiPinodo.getFile(`/finanzas/ventas/excel${rangoQuery(params)}`, {
			requireAuth: true
		});
	}

	/**
	 * Ingreso − costo = margen bruto, por SKU (de mayor a menor margen) y por mes. No incluye
	 * gastos: no es la utilidad neta.
	 */
	async rentabilidad(params: FinanzasParams = {}): Promise<ReporteRentabilidad> {
		return apiPinodo.get<ReporteRentabilidad>(`/finanzas/rentabilidad${rangoQuery(params)}`, {
			requireAuth: true
		});
	}

	/** El reporte de rentabilidad como .xlsx (hojas Resumen y Detalle) */
	async rentabilidadExcel(params: FinanzasParams = {}): Promise<ArchivoDescargado> {
		return apiPinodo.getFile(`/finanzas/rentabilidad/excel${rangoQuery(params)}`, {
			requireAuth: true
		});
	}
}

export const finanzasService = new FinanzasService();
