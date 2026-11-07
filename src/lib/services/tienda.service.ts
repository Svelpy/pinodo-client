import { apiPinodo } from '#lib/config/index.ts';
import { TIENDA_DATA_KEY } from '#lib/constants/index.ts';
import type { Tienda } from '#lib/interfaces/index.ts';

/** Configuración de la tienda: se pide a la API y se guarda en localStorage para no repetir la petición */
class TiendaService {
	async get(): Promise<Tienda> {
		return apiPinodo.get<Tienda>('/config/');
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
