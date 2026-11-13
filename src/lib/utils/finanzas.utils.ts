import { RANGO_FECHA, type ReporteFinanzas } from '#lib/constants/index.ts';
import type { FinanzasFiltros, FinanzasParams, FinanzasPeriodo } from '#lib/interfaces/index.ts';
import { todayISO } from './date';
import { formatDate } from './format';
import { rangoFechas } from './venta.utils';

/** Parámetros de `GET /finanzas/*` para los filtros elegidos */
export function finanzasFiltrosToParams(
	filtros: FinanzasFiltros,
	today: string = todayISO()
): FinanzasParams {
	const { desde, hasta } =
		filtros.rango === RANGO_FECHA.PERSONALIZADO
			? { desde: filtros.desde || undefined, hasta: filtros.hasta || undefined }
			: rangoFechas(filtros.rango, today);
	return { ...(desde && { desde }), ...(hasta && { hasta }) };
}

const ARCHIVO_REPORTE: Record<ReporteFinanzas, string> = {
	VENTAS: 'reporte-ventas',
	RENTABILIDAD: 'reporte-rentabilidad'
};

/**
 * Nombre del Excel cuando la API no envía uno: `reporte-ventas_2026-11-01_2026-11-13.xlsx`.
 * Sin `desde` es desde el inicio; sin `hasta`, hasta hoy.
 */
export function nombreArchivoReporte(
	reporte: ReporteFinanzas,
	{ desde, hasta }: FinanzasParams,
	today: string = todayISO()
): string {
	return `${ARCHIVO_REPORTE[reporte]}_${desde ?? 'inicio'}_${hasta ?? today}.xlsx`;
}

/** "1 oct 2026 – 13 nov 2026", o una sola fecha si el periodo es de un día */
export function formatPeriodo(periodo: Pick<FinanzasPeriodo, 'desde' | 'hasta'>): string {
	const desde = formatDate(periodo.desde);
	return periodo.desde === periodo.hasta ? desde : `${desde} – ${formatDate(periodo.hasta)}`;
}
