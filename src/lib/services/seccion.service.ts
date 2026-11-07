import { apiPinodo } from '#lib/config/index.ts';
import type {
	CreateSeccionRequest,
	ListSeccionesParams,
	Seccion,
	UpdateSeccionRequest
} from '#lib/interfaces/index.ts';

/** Gestión de las secciones del catálogo (`/secciones/`) */
class SeccionService {
	/** Todas las secciones (sin paginación); `is_visible` filtra por visibilidad */
	async list({ is_visible }: ListSeccionesParams = {}): Promise<Seccion[]> {
		const query = new URLSearchParams();
		if (is_visible !== undefined) query.set('is_visible', String(is_visible));
		const suffix = query.size > 0 ? `?${query}` : '';
		return apiPinodo.get<Seccion[]>(`/secciones/${suffix}`, { requireAuth: true });
	}

	/** El slug se genera a partir del nombre y debe ser único (409 si ya existe) */
	async create(data: CreateSeccionRequest): Promise<Seccion> {
		return apiPinodo.post<Seccion>('/secciones/', data, { requireAuth: true });
	}

	async update(id: string, data: UpdateSeccionRequest): Promise<Seccion> {
		return apiPinodo.patch<Seccion>(`/secciones/${id}`, data, { requireAuth: true });
	}

	/** Eliminación lógica: la API responde 409 si la sección tiene categorías o productos activos */
	async remove(id: string): Promise<void> {
		await apiPinodo.delete(`/secciones/${id}`, undefined, { requireAuth: true });
	}
}

export const seccionService = new SeccionService();
