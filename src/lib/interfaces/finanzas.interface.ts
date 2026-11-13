import type { MetodoPago, RangoFecha, VentaCanal } from '#lib/constants/index.ts';

/** Rango de fechas de los reportes de finanzas (`desde`/`hasta`: fechas de la tienda, incluidas) */
export interface FinanzasParams {
	/** YYYY-MM-DD. Sin ella, desde la primera venta */
	desde?: string;
	/** YYYY-MM-DD. Sin ella, hasta hoy */
	hasta?: string;
}

/** Filtros de la página de finanzas */
export interface FinanzasFiltros {
	rango: RangoFecha;
	/** Solo con rango PERSONALIZADO (YYYY-MM-DD) */
	desde: string;
	hasta: string;
}

/** Periodo que cubre un reporte, ya resuelto por la API */
export interface FinanzasPeriodo {
	desde: string;
	hasta: string;
	/** true si se pidió sin `desde` ni `hasta` (toda la historia) */
	sin_filtros: boolean;
	/** Momento en que se generó (ISO con zona horaria de la tienda) */
	generado_at: string;
}

// ── Reporte de ventas ─────────────────────────────────────────────────────────────────────────

/**
 * Totales de las ventas confirmadas del periodo:
 * `venta_precio_normal − rebajas − descuentos_prenda − descuentos_venta = total_vendido`.
 * Las anuladas solo cuentan en `ventas_anuladas` y `monto_anulado`.
 */
export interface ReporteVentasResumen {
	ventas: number;
	unidades: number;
	/** Lo vendido a precio de lista, sin rebajas ni descuentos */
	venta_precio_normal: number;
	/** Diferencia entre el precio normal y el cobrado (precio rebajado) */
	rebajas: number;
	descuentos_prenda: number;
	descuentos_venta: number;
	total_vendido: number;
	ticket_promedio: number;
	unidades_por_venta: number;
	ventas_anuladas: number;
	monto_anulado: number;
}

export interface CobradoPorMetodo {
	metodo: MetodoPago;
	/** Cantidad de pagos con ese método */
	pagos: number;
	monto: number;
	/** Parte del total cobrado, de 0 a 1 */
	porcentaje: number;
}

/** Una línea por prenda vendida. Los precios son unitarios; descuentos y total, de la línea */
export interface ReporteVentaLinea {
	/** Fecha de confirmación (YYYY-MM-DD, de la tienda) */
	fecha: string;
	/** HH:MM:SS */
	hora: string;
	venta_id: string;
	numero: number;
	canal: VentaCanal;
	vendedor: string;
	metodos_pago: MetodoPago[];
	sku_id: string;
	producto: string;
	color: string;
	talla: string;
	codigo_barras: string | null;
	cantidad: number;
	precio_normal: number;
	precio_cobrado: number;
	descuento_prenda: number;
	/** Parte del descuento de la venta que le toca a la línea */
	descuento_venta: number;
	total: number;
}

/** `GET /finanzas/ventas` */
export interface ReporteVentas {
	periodo: FinanzasPeriodo;
	resumen: ReporteVentasResumen;
	cobrado_por_metodo: CobradoPorMetodo[];
	detalle: ReporteVentaLinea[];
}

// ── Reporte de rentabilidad ───────────────────────────────────────────────────────────────────

/** `venta_precio_normal − descuentos = ingreso_neto`; `ingreso_neto − costo = margen_bruto` */
export interface RentabilidadResumen {
	unidades: number;
	venta_precio_normal: number;
	descuentos: number;
	ingreso_neto: number;
	costo: number;
	margen_bruto: number;
	/** De 0 a 1 (puede ser negativo si se vendió por debajo del costo) */
	margen_porcentaje: number;
	/** Unidades vendidas de SKUs sin costo registrado: inflan el margen */
	unidades_sin_costo: number;
}

export interface RentabilidadMes {
	anio: number;
	/** 1–12 */
	mes: number;
	unidades: number;
	ingreso_neto: number;
	costo: number;
	margen_bruto: number;
	margen_porcentaje: number;
}

/** Una línea por SKU con el total del periodo */
export interface RentabilidadSku {
	sku_id: string;
	producto: string;
	color: string;
	talla: string;
	codigo_barras: string | null;
	cantidad: number;
	venta_precio_normal: number;
	descuentos: number;
	ingreso_neto: number;
	costo: number;
	margen_bruto: number;
	margen_porcentaje: number;
}

/** `GET /finanzas/rentabilidad` */
export interface ReporteRentabilidad {
	periodo: FinanzasPeriodo;
	resumen: RentabilidadResumen;
	/** Evolución mes a mes */
	por_mes: RentabilidadMes[];
	/** De mayor a menor margen */
	detalle: RentabilidadSku[];
}

/** Archivo descargado de la API (p. ej. un reporte en Excel) */
export interface ArchivoDescargado {
	blob: Blob;
	/** Nombre que propone la API (`Content-Disposition`); null si no lo envía o no es legible */
	filename: string | null;
}
