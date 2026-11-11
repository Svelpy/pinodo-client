import type { ImagenTipo } from '#lib/constants/index.ts';
import type { PaginationParams } from './pagination.interface';

/** Imagen de la biblioteca (`GET /imagenes/biblioteca`) con el producto y el color a los que pertenece */
export interface Archivo {
	id: string;
	producto_color_id: string;
	url: string;
	tipo: ImagenTipo;
	created_at: string;
	updated_at: string;
	producto_id: string;
	producto_nombre: string;
	color_id: string;
	color_nombre: string;
	color_codigo_hex: string;
}

export interface ListArchivosParams extends PaginationParams {
	producto_id?: string;
	color_id?: string;
	tipo?: ImagenTipo;
	/** Coincidencias parciales en el nombre del producto; máx. 200 caracteres */
	nombre?: string;
}
