/** Configuración de la tienda: respuesta de `GET /config/` */
export interface Tienda {
	nombre_tienda: string;
	descripcion: string | null;
	logo_url: string | null;
	favicon_url: string | null;
	email_contacto: string | null;
	telefono: string | null;
	whatsapp: string | null;
	direccion: string | null;
	map_url: string | null;
	ciudad: string | null;
	/** Día de la semana → rango horario, p. ej. `{ lunes: '09:00-20:00' }` */
	horario: Record<string, string> | null;
	/** Red social → URL, p. ej. `{ instagram: 'https://instagram.com/tienda' }` */
	redes_sociales: Record<string, string> | null;
	en_mantenimiento: boolean;
	updated_at: string | null;
}

/**
 * Body de `PATCH /config/` (se envía como multipart): solo los campos modificados. `null` borra un
 * texto opcional; `horario` y `redes_sociales` se reemplazan completos (`{}` los vacía).
 */
export interface UpdateTiendaRequest {
	nombre_tienda?: string;
	descripcion?: string | null;
	email_contacto?: string | null;
	telefono?: string | null;
	whatsapp?: string | null;
	direccion?: string | null;
	map_url?: string | null;
	ciudad?: string | null;
	horario?: Record<string, string>;
	redes_sociales?: Record<string, string>;
	en_mantenimiento?: boolean;
	logo?: File;
	favicon?: File;
	eliminar_logo?: boolean;
	eliminar_favicon?: boolean;
}

/** Un día del horario en el formulario: cerrado conserva las horas para poder reabrirlo */
export interface HorarioDiaForm {
	dia: string;
	abierto: boolean;
	/** `HH:MM` */
	apertura: string;
	/** `HH:MM` */
	cierre: string;
}

export interface RedSocialForm {
	red: string;
	url: string;
}

/** Valores del formulario "Mi negocio" (los textos vacíos se envían como null) */
export interface TiendaFormValues {
	nombre_tienda: string;
	descripcion: string;
	email_contacto: string;
	telefono: string;
	whatsapp: string;
	direccion: string;
	map_url: string;
	ciudad: string;
	/** Siempre los 7 días, de lunes a domingo */
	horario: HorarioDiaForm[];
	redes_sociales: RedSocialForm[];
	en_mantenimiento: boolean;
}

/** Logo y favicon del formulario: un archivo nuevo reemplaza al actual; `eliminar` lo quita */
export interface TiendaImagenForm {
	file: File | null;
	eliminar: boolean;
}
