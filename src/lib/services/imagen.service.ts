import { apiPinodo } from '#lib/config/index.ts';
import type { ImagenUploadResponse } from '#lib/interfaces/index.ts';

/** Imágenes de producto (`/imagenes/`) */
class ImagenService {
	/**
	 * Sube el archivo (multipart) a la carpeta de pendientes y devuelve su url, sin crear ningún
	 * registro. La url se envía después al crear el producto; las que no se usen quedan huérfanas.
	 */
	async upload(file: File): Promise<ImagenUploadResponse> {
		const body = new FormData();
		body.append('file', file);
		return apiPinodo.post<ImagenUploadResponse>('/imagenes/uploads', body, { requireAuth: true });
	}
}

export const imagenService = new ImagenService();
