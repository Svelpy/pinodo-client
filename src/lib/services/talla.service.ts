import { apiPinodo } from '#lib/config/index.ts';
import type { CreateTallaRequest, Talla, UpdateTallaRequest } from '#lib/interfaces/index.ts';

/** Gestión de las tallas del catálogo (`/tallas/`) */
class TallaService {
	/** Todas las tallas (sin paginación), ordenadas por fecha de creación */
	async list(): Promise<Talla[]> {
		return apiPinodo.get<Talla[]>('/tallas/', { requireAuth: true });
	}

	/** La etiqueta debe ser única sin distinguir mayúsculas (409 si ya existe) */
	async create(data: CreateTallaRequest): Promise<Talla> {
		return apiPinodo.post<Talla>('/tallas/', data, { requireAuth: true });
	}

	async update(id: string, data: UpdateTallaRequest): Promise<Talla> {
		return apiPinodo.patch<Talla>(`/tallas/${id}`, data, { requireAuth: true });
	}

	/** Eliminación lógica: la API responde 409 si la talla está asignada a SKUs activos */
	async remove(id: string): Promise<void> {
		await apiPinodo.delete(`/tallas/${id}`, undefined, { requireAuth: true });
	}
}

export const tallaService = new TallaService();
