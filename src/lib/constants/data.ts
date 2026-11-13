import type { Role } from '#lib/config/permissions.config.ts';

export const NO_DATA_LABEL = '—';

/** Límites de paginación que acepta la API (`per_page`: 1–100) */
export const PAGINATION = {
	DEFAULT_PAGE: 1,
	DEFAULT_PER_PAGE: 20,
	MAX_PER_PAGE: 100,
	PER_PAGE_OPTIONS: [10, 20, 50, 100]
} as const;

/** Etiquetas de rol de usuario (valores que devuelve la API) */
export const ROLE_LABEL: Record<Role, string> = {
	SUPERADMIN: 'Superadministrador',
	OWNER: 'Propietario',
	ADMIN: 'Administrador',
	CAJERO: 'Cajero'
};

/** Etiquetas de rol en plural (p. ej. pestañas de Usuarios) */
export const ROLE_PLURAL_LABEL: Record<Role, string> = {
	SUPERADMIN: 'Superadministradores',
	OWNER: 'Propietarios',
	ADMIN: 'Administradores',
	CAJERO: 'Cajeros'
};

/** Etiquetas de género de usuario (valores que acepta la API) */
export const USER_GENERO_LABEL: Record<'M' | 'F' | 'O', string> = {
	M: 'Masculino',
	F: 'Femenino',
	O: 'Otro'
};

/** Páginas legales públicas: se enlazan desde la landing, el login, el registro y entre sí */
export const LEGAL_PAGES = [
	{ href: '/(tienda)/(legal)/terminos', label: 'Términos y condiciones' },
	{ href: '/(tienda)/(legal)/privacidad', label: 'Política de privacidad' },
	{ href: '/(tienda)/(legal)/cookies', label: 'Política de cookies' }
] as const;

/**
 * Tipos de imagen de un producto que acepta la API (`tipo`); por defecto `MODELO`.
 * Si la API suma más tipos, se agregan aquí y en `IMAGEN_TIPO_LABEL`: el formulario los ofrece solo.
 */
export const IMAGEN_TIPO = {
	MODELO: 'MODELO',
	PRENDA: 'PRENDA',
	DETALLE: 'DETALLE'
} as const;
export type ImagenTipo = (typeof IMAGEN_TIPO)[keyof typeof IMAGEN_TIPO];

/** Tipo que se asigna a una imagen nueva, el mismo que la API usa por defecto */
export const IMAGEN_TIPO_DEFAULT: ImagenTipo = IMAGEN_TIPO.MODELO;

/** Etiquetas de los tipos de imagen */
export const IMAGEN_TIPO_LABEL: Record<ImagenTipo, string> = {
	MODELO: 'Modelo',
	PRENDA: 'Prenda',
	DETALLE: 'Detalle'
};

/** Archivos de imagen de producto: la API no admite SVG ni archivos de más de 5 MB */
export const IMAGEN_LIMITS = {
	MAX_BYTES: 5 * 1024 * 1024
} as const;

/** Estados de una venta: PENDIENTE = pedido sin cobrar; CONFIRMADA = cobrada (descontó stock) */
export const VENTA_ESTADO = {
	PENDIENTE: 'PENDIENTE',
	CONFIRMADA: 'CONFIRMADA',
	CANCELADA: 'CANCELADA'
} as const;
export type VentaEstado = (typeof VENTA_ESTADO)[keyof typeof VENTA_ESTADO];

export const VENTA_ESTADO_LABEL: Record<VentaEstado, string> = {
	PENDIENTE: 'Pendiente',
	CONFIRMADA: 'Cobrada',
	CANCELADA: 'Cancelada'
};

/** Variante de `Badge` para cada estado */
export const VENTA_ESTADO_BADGE: Record<VentaEstado, 'warning' | 'success' | 'error'> = {
	PENDIENTE: 'warning',
	CONFIRMADA: 'success',
	CANCELADA: 'error'
};

/** Por dónde llegó la venta */
export const VENTA_CANAL = {
	/** Venta presencial en el local */
	TIENDA: 'TIENDA',
	/** El cliente escribe directo por WhatsApp */
	WHATSAPP: 'WHATSAPP',
	/** Venta tomada durante una transmisión en vivo */
	TIKTOK_LIVE: 'TIKTOK_LIVE',
	/** DM o TikTok Shop, fuera del live */
	TIKTOK: 'TIKTOK',
	/** DM de Instagram */
	INSTAGRAM: 'INSTAGRAM',
	/** Messenger o Marketplace */
	FACEBOOK: 'FACEBOOK',
	/** Pedido desde el catálogo público */
	PAGINA_WEB: 'PAGINA_WEB',
	OTROS: 'OTROS'
} as const;
export type VentaCanal = (typeof VENTA_CANAL)[keyof typeof VENTA_CANAL];

export const VENTA_CANAL_LABEL: Record<VentaCanal, string> = {
	TIENDA: 'Tienda',
	WHATSAPP: 'WhatsApp',
	TIKTOK_LIVE: 'TikTok Live',
	TIKTOK: 'TikTok',
	INSTAGRAM: 'Instagram',
	FACEBOOK: 'Facebook',
	PAGINA_WEB: 'Página web',
	OTROS: 'Otro canal'
};

export const METODO_PAGO = {
	EFECTIVO: 'EFECTIVO',
	QR: 'QR',
	TRANSFERENCIA: 'TRANSFERENCIA',
	TARJETA: 'TARJETA',
	CHEQUE: 'CHEQUE',
	VALES: 'VALES',
	OTROS: 'OTROS'
} as const;
export type MetodoPago = (typeof METODO_PAGO)[keyof typeof METODO_PAGO];

export const METODO_PAGO_LABEL: Record<MetodoPago, string> = {
	EFECTIVO: 'Efectivo',
	QR: 'QR',
	TRANSFERENCIA: 'Transferencia',
	TARJETA: 'Tarjeta',
	CHEQUE: 'Cheque',
	VALES: 'Vales',
	OTROS: 'Otro método'
};

/** Rangos de fecha rápidos del historial de ventas */
export const RANGO_FECHA = {
	HOY: 'HOY',
	AYER: 'AYER',
	SIETE_DIAS: 'SIETE_DIAS',
	MES: 'MES',
	TODO: 'TODO',
	PERSONALIZADO: 'PERSONALIZADO'
} as const;
export type RangoFecha = (typeof RANGO_FECHA)[keyof typeof RANGO_FECHA];

export const RANGO_FECHA_LABEL: Record<RangoFecha, string> = {
	HOY: 'Hoy',
	AYER: 'Ayer',
	SIETE_DIAS: 'Últimos 7 días',
	MES: 'Este mes',
	TODO: 'Todas las fechas',
	PERSONALIZADO: 'Personalizado'
};

/** Días de la semana en su forma canónica (las claves del `horario` de la tienda), de lunes a domingo */
export const DIAS_SEMANA = [
	'lunes',
	'martes',
	'miércoles',
	'jueves',
	'viernes',
	'sábado',
	'domingo'
] as const;
export type DiaSemana = (typeof DIAS_SEMANA)[number];

export const DIA_SEMANA_LABEL: Record<DiaSemana, string> = {
	lunes: 'Lunes',
	martes: 'Martes',
	miércoles: 'Miércoles',
	jueves: 'Jueves',
	viernes: 'Viernes',
	sábado: 'Sábado',
	domingo: 'Domingo'
};

/** Redes que se sugieren al escribir el nombre de una red social (la API acepta cualquier otra) */
export const REDES_SOCIALES_SUGERIDAS = [
	'instagram',
	'facebook',
	'tiktok',
	'youtube',
	'x',
	'linkedin',
	'pinterest'
] as const;

/**
 * Qué originó un movimiento del kardex (`TipoMovimiento` del backend). AJUSTE = un documento de
 * ajuste de inventario (incluida la carga inicial); VENTA = al cobrar una venta; ANULACION = al
 * anular una venta cobrada (devuelve el stock).
 */
export const MOVIMIENTO_TIPO = {
	AJUSTE: 'AJUSTE',
	VENTA: 'VENTA',
	ANULACION: 'ANULACION'
} as const;
export type MovimientoTipo = (typeof MOVIMIENTO_TIPO)[keyof typeof MOVIMIENTO_TIPO];

export const MOVIMIENTO_TIPO_LABEL: Record<MovimientoTipo, string> = {
	AJUSTE: 'Ajuste',
	VENTA: 'Venta',
	ANULACION: 'Anulación'
};

/** Variante de `Badge` para cada tipo de movimiento */
export const MOVIMIENTO_TIPO_BADGE: Record<MovimientoTipo, 'info' | 'warning' | 'secondary'> = {
	AJUSTE: 'secondary',
	VENTA: 'info',
	ANULACION: 'warning'
};

/** Por qué se ajustó el stock: el motivo de un ajuste de inventario (`MotivoAjuste` del backend) */
export const AJUSTE_MOTIVO = {
	/** Stock con que nacen los SKUs; solo lo genera el sistema */
	INICIAL: 'INICIAL',
	/** Entra mercadería con su costo; recalcula el costo promedio */
	RECEPCION: 'RECEPCION',
	/** Conteo físico: se registra la diferencia con lo contado */
	CONTEO: 'CONTEO',
	/** Sale por daño o defecto */
	MERMA: 'MERMA',
	ROBO_PERDIDA: 'ROBO_PERDIDA',
	/** Corrige un error de carga, en cualquier sentido */
	CORRECCION: 'CORRECCION'
} as const;
export type AjusteMotivo = (typeof AJUSTE_MOTIVO)[keyof typeof AJUSTE_MOTIVO];

export const AJUSTE_MOTIVO_LABEL: Record<AjusteMotivo, string> = {
	INICIAL: 'Stock inicial',
	RECEPCION: 'Recepción',
	CONTEO: 'Conteo físico',
	MERMA: 'Merma',
	ROBO_PERDIDA: 'Robo o pérdida',
	CORRECCION: 'Corrección'
};

/** Variante de `Badge` para cada motivo: verde entra, rojo sale, neutro en cualquier sentido */
export const AJUSTE_MOTIVO_BADGE: Record<
	AjusteMotivo,
	'outline' | 'success' | 'info' | 'error' | 'secondary'
> = {
	INICIAL: 'outline',
	RECEPCION: 'success',
	CONTEO: 'info',
	MERMA: 'error',
	ROBO_PERDIDA: 'error',
	CORRECCION: 'secondary'
};

/** Límites de los filtros de `GET /movimientos-inventario/costos` */
export const KARDEX_LIMITS = {
	NOMBRE_MAX: 200,
	CODIGO_BARRAS_MAX: 50
} as const;

/** Reportes de la página de finanzas (una pestaña cada uno) */
export const REPORTE_FINANZAS = {
	VENTAS: 'VENTAS',
	RENTABILIDAD: 'RENTABILIDAD'
} as const;
export type ReporteFinanzas = (typeof REPORTE_FINANZAS)[keyof typeof REPORTE_FINANZAS];

export const REPORTE_FINANZAS_LABEL: Record<ReporteFinanzas, string> = {
	VENTAS: 'Ventas',
	RENTABILIDAD: 'Rentabilidad'
};
