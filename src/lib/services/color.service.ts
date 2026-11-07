import { apiPinodo } from '#lib/config/index.ts';
import type { Color, CreateColorRequest, UpdateColorRequest } from '#lib/interfaces/index.ts';

/** Gestión de los colores del catálogo (`/colores/`) */
class ColorService {
	/** Todos los colores (sin paginación), ordenados alfabéticamente por nombre */
	async list(): Promise<Color[]> {
		return apiPinodo.get<Color[]>('/colores/', { requireAuth: true });
	}

	/** El nombre debe ser único: la API compara su slug (409 si ya existe) */
	async create(data: CreateColorRequest): Promise<Color> {
		return apiPinodo.post<Color>('/colores/', data, { requireAuth: true });
	}

	async update(id: string, data: UpdateColorRequest): Promise<Color> {
		return apiPinodo.patch<Color>(`/colores/${id}`, data, { requireAuth: true });
	}

	/** Eliminación lógica: la API responde 409 si el color está asignado a productos activos */
	async remove(id: string): Promise<void> {
		await apiPinodo.delete(`/colores/${id}`, undefined, { requireAuth: true });
	}
}

export const colorService = new ColorService();
