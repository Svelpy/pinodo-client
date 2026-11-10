import { apiPinodo } from '#lib/config/index.ts';
import type {
	CreateProductoRequest,
	ListProductosParams,
	PaginatedResponse,
	Producto,
	ProductoDetalle,
	UpdateProductoRequest
} from '#lib/interfaces/index.ts';
import { buildPaginationQuery } from '#lib/utils/index.ts';

/**
 * Gestión de los productos del catálogo (`/productos/`). Los colores, imágenes y SKUs de un producto
 * existente se editan con `productoColorService` y `skuService`.
 */
class ProductoService {
	/** Del más reciente al más antiguo. `categoria_id` incluye las subcategorías */
	async list({
		seccion_id,
		categoria_id,
		is_visible,
		nombre,
		...pagination
	}: ListProductosParams = {}): Promise<PaginatedResponse<Producto>> {
		const query = buildPaginationQuery(pagination);
		if (seccion_id) query.set('seccion_id', seccion_id);
		if (categoria_id) query.set('categoria_id', categoria_id);
		if (is_visible !== undefined) query.set('is_visible', String(is_visible));
		const search = nombre?.trim();
		if (search) query.set('nombre', search);
		return apiPinodo.get<PaginatedResponse<Producto>>(`/productos/?${query}`, {
			requireAuth: true
		});
	}

	/** Ficha completa: sección, categorías, y colores con su galería y SKUs */
	async get(id: string): Promise<ProductoDetalle> {
		return apiPinodo.get<ProductoDetalle>(`/productos/${id}`, { requireAuth: true });
	}

	/**
	 * Crea el producto con sus categorías, colores, imágenes y SKUs en una sola transacción: si falla
	 * cualquier parte no se guarda nada. Las imágenes se suben antes (`imagenService.upload`).
	 * 409 si una categoría padre ya tiene productos asignados.
	 */
	async create(data: CreateProductoRequest): Promise<ProductoDetalle> {
		return apiPinodo.post<ProductoDetalle>('/productos/', data, { requireAuth: true });
	}

	/**
	 * Datos generales y categorías; responde la ficha completa. Cambiar de sección sin enviar
	 * `categoria_ids` quita todas las categorías.
	 */
	async update(id: string, data: UpdateProductoRequest): Promise<ProductoDetalle> {
		return apiPinodo.patch<ProductoDetalle>(`/productos/${id}`, data, { requireAuth: true });
	}

	/** Eliminación lógica en cascada: también elimina sus colores, imágenes y SKUs */
	async remove(id: string): Promise<void> {
		await apiPinodo.delete(`/productos/${id}`, undefined, { requireAuth: true });
	}
}

export const productoService = new ProductoService();
