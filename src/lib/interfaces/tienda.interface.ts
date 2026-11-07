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
