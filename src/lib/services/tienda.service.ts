import { apiPinodo } from '#lib/config/index.ts';
import { TIENDA_DATA_KEY } from '#lib/constants/index.ts';
import type { Tienda, UpdateTiendaRequest } from '#lib/interfaces/index.ts';

/**
 * Multipart del PATCH: `null` viaja como texto vacío (la API lo borra), los objetos como texto JSON
 * y los booleanos como `true`/`false`. Lo que no viene en `data` no se envía y no cambia.
 */
export function toTiendaFormData(data: UpdateTiendaRequest): FormData {
	const body = new FormData();
	for (const [key, value] of Object.entries(data)) {
		if (value === undefined) continue;
		if (value instanceof File) body.append(key, value);
		else if (value === null) body.append(key, '');
		else if (typeof value === 'object') body.append(key, JSON.stringify(value));
		else body.append(key, String(value));
	}
	return body;
}

/** Configuración de la tienda: se pide a la API y se guarda en localStorage para no repetir la petición */
class TiendaService {
	async get(): Promise<Tienda> {
		return apiPinodo.get<Tienda>('/config/');
	}

	/** Edita la configuración ("Mi negocio"); responde la configuración completa */
	async update(data: UpdateTiendaRequest): Promise<Tienda> {
		return apiPinodo.patch<Tienda>('/config/', toTiendaFormData(data), { requireAuth: true });
	}

	getCached(): Tienda | null {
		try {
			if (typeof localStorage === 'undefined') return null;
			const data = localStorage.getItem(TIENDA_DATA_KEY);
			return data ? JSON.parse(data) : null;
		} catch (error) {
			console.warn('Error accessing localStorage for tienda data:', error);
			return null;
		}
	}

	setCached(tienda: Tienda): void {
		try {
			if (typeof localStorage === 'undefined') return;
			localStorage.setItem(TIENDA_DATA_KEY, JSON.stringify(tienda));
		} catch (error) {
			console.warn('Error saving tienda data to localStorage:', error);
		}
	}

	clearCached(): void {
		try {
			if (typeof localStorage === 'undefined') return;
			localStorage.removeItem(TIENDA_DATA_KEY);
		} catch (error) {
			console.warn('Error clearing tienda data:', error);
		}
	}
}

export const tiendaService = new TiendaService();
