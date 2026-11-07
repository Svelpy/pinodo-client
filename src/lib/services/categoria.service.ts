import { apiPinodo } from '#lib/config/index.ts';
import type {
	ArbolCategoriasParams,
	Categoria,
	CreateCategoriaRequest,
	SeccionArbol,
	UpdateCategoriaRequest
} from '#lib/interfaces/index.ts';

/** Gestión de las categorías del catálogo (`/categorias/`) */
class CategoriaService {
	/**
	 * Todas las secciones (también las que no tienen categorías) con su árbol de categorías.
	 * Sin paginación.
	 */
	async arbol({ seccion_id, is_visible }: ArbolCategoriasParams = {}): Promise<SeccionArbol[]> {
		const query = new URLSearchParams();
		if (seccion_id) query.set('seccion_id', seccion_id);
		if (is_visible !== undefined) query.set('is_visible', String(is_visible));
		const suffix = query.size > 0 ? `?${query}` : '';
		return apiPinodo.get<SeccionArbol[]>(`/categorias/arbol${suffix}`, { requireAuth: true });
	}

	/** El slug es único dentro de la sección. 409 si el padre ya tiene productos asignados */
	async create(data: CreateCategoriaRequest): Promise<Categoria> {
		return apiPinodo.post<Categoria>('/categorias/', data, { requireAuth: true });
	}

	/**
	 * La API rechaza ciclos, padres de otra sección y cambiar de sección una categoría con
	 * subcategorías activas o productos
	 */
	async update(id: string, data: UpdateCategoriaRequest): Promise<Categoria> {
		return apiPinodo.patch<Categoria>(`/categorias/${id}`, data, { requireAuth: true });
	}

	/** Eliminación lógica: 409 si tiene subcategorías activas. Sus productos no se eliminan */
	async remove(id: string): Promise<void> {
		await apiPinodo.delete(`/categorias/${id}`, undefined, { requireAuth: true });
	}
}

export const categoriaService = new CategoriaService();
