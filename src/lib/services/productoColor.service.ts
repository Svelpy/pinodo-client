import { apiPinodo } from '#lib/config/index.ts';
import type {
	AddProductoColorRequest,
	ProductoColor,
	UpdateProductoColorRequest
} from '#lib/interfaces/index.ts';

/**
 * Colores de un producto existente (`/producto-colores/`), cada uno con su galería y sus SKUs.
 * Todas las operaciones son una transacción: si falla una parte no se guarda nada.
 */
class ProductoColorService {
	/** Añade un color al producto; 409 si el producto ya tiene ese color */
	async create(data: AddProductoColorRequest): Promise<ProductoColor> {
		return apiPinodo.post<ProductoColor>('/producto-colores/', data, { requireAuth: true });
	}

	/**
	 * Lo omitido no cambia. `imagenes` reemplaza la galería; en `skus` las filas con `id` actualizan
	 * (sin stock) y las nuevas crean; `sku_ids_eliminar` borra SKUs.
	 */
	async update(id: string, data: UpdateProductoColorRequest): Promise<ProductoColor> {
		return apiPinodo.patch<ProductoColor>(`/producto-colores/${id}`, data, { requireAuth: true });
	}

	/** Eliminación lógica en cascada: también elimina sus imágenes y SKUs */
	async remove(id: string): Promise<void> {
		await apiPinodo.delete(`/producto-colores/${id}`, undefined, { requireAuth: true });
	}
}

export const productoColorService = new ProductoColorService();
