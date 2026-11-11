import { apiPinodo } from '#lib/config/index.ts';
import type { Archivo, ListArchivosParams, PaginatedResponse } from '#lib/interfaces/index.ts';
import { buildPaginationQuery } from '#lib/utils/index.ts';

/**
 * Biblioteca de archivos del panel: todas las imágenes de los productos (`/imagenes/`). Se agregan
 * desde cada producto (`imagenService.upload`); aquí solo se consultan y se eliminan.
 */
class ArchivoService {
	/** De la más reciente a la más antigua. No incluye las subidas que aún no se asocian a un color */
	async list({
		producto_id,
		color_id,
		tipo,
		nombre,
		...pagination
	}: ListArchivosParams = {}): Promise<PaginatedResponse<Archivo>> {
		const query = buildPaginationQuery(pagination);
		if (producto_id) query.set('producto_id', producto_id);
		if (color_id) query.set('color_id', color_id);
		if (tipo) query.set('tipo', tipo);
		const search = nombre?.trim();
		if (search) query.set('nombre', search);
		return apiPinodo.get<PaginatedResponse<Archivo>>(`/imagenes/biblioteca?${query}`, {
			requireAuth: true
		});
	}

	/** Eliminación lógica: el archivo se conserva en Cloudinary */
	async remove(id: string): Promise<void> {
		await apiPinodo.delete(`/imagenes/${id}`, undefined, { requireAuth: true });
	}
}

export const archivoService = new ArchivoService();
