import type { ImagenTipo } from '#lib/constants/index.ts';
import type { CategoriaItem } from './categoria.interface';
import type { Color } from './color.interface';
import type { PaginationParams } from './pagination.interface';
import type { Seccion } from './seccion.interface';
import type { Talla } from './talla.interface';

/** Color de un producto tal como aparece en su resumen */
export interface ProductoResumenColor {
	nombre: string;
	codigo_hex: string;
}

/** Datos calculados por la API para mostrar el producto en el listado */
export interface ProductoResumen {
	portada_url: string | null;
	/** Rango de precios vigentes hoy; null si el producto no tiene SKUs */
	precio_desde: number | null;
	precio_hasta: number | null;
	stock_total: number;
	colores: ProductoResumenColor[];
}

/** Producto del listado (`GET /productos/`) */
export interface Producto {
	id: string;
	nombre: string;
	descripcion: string | null;
	cuidados: string | null;
	composicion: string | null;
	is_visible: boolean;
	seccion_id: string;
	seccion: Seccion;
	resumen: ProductoResumen;
	created_at: string;
	updated_at: string;
}

export interface ProductoImagen {
	id: string;
	producto_color_id: string;
	tipo: ImagenTipo;
	url: string;
	created_at: string;
	updated_at: string;
}

export interface ProductoPrecio {
	normal: number;
	rebajado: number | null;
	/** Fecha YYYY-MM-DD hasta la que rige el precio rebajado */
	rebaja_hasta: string | null;
}

export interface ProductoStock {
	cantidad: number;
	minimo: number;
	actualizado: string;
}

export interface ProductoSku {
	id: string;
	producto_color_id: string;
	talla_id: string;
	talla: Talla;
	codigo_barras: string | null;
	is_visible: boolean;
	precio: ProductoPrecio;
	/** Precio que rige hoy: el rebajado si está vigente, si no el normal */
	precio_vigente: number;
	stock: ProductoStock;
	created_at: string;
	updated_at: string;
}

/** Un color del producto con su galería de imágenes y sus SKUs (ordenados por talla) */
export interface ProductoColor {
	id: string;
	producto_id: string;
	color_id: string;
	color: Color;
	is_visible: boolean;
	imagenes: ProductoImagen[];
	skus: ProductoSku[];
	created_at: string;
	updated_at: string;
}

/** Ficha completa (`GET /productos/{id}` y respuesta de crear) */
export interface ProductoDetalle extends Producto {
	/** En el orden en que se asignaron */
	categorias: CategoriaItem[];
	colores: ProductoColor[];
}

/** `POST /imagenes/uploads`: la imagen queda pendiente hasta que se envía su url al crear el producto */
export interface ImagenUploadResponse {
	url: string;
}

export interface CreateProductoImagenRequest {
	url: string;
	tipo: ImagenTipo;
}

export interface CreateProductoSkuRequest {
	talla_id: string;
	codigo_barras: string | null;
	is_visible: boolean;
	precio: ProductoPrecio;
	stock: { cantidad: number; minimo: number };
}

export interface CreateProductoColorRequest {
	color_id: string;
	is_visible: boolean;
	imagenes: CreateProductoImagenRequest[];
	skus: CreateProductoSkuRequest[];
}

/**
 * `POST /productos/`: crea el producto con sus categorías, colores, imágenes y SKUs en una sola
 * transacción. Sin `categoria_ids` ni `colores` crea solo el producto.
 */
export interface CreateProductoRequest {
	seccion_id: string;
	nombre: string;
	descripcion: string | null;
	cuidados: string | null;
	composicion: string | null;
	is_visible: boolean;
	categoria_ids: string[];
	colores: CreateProductoColorRequest[];
}

export interface ListProductosParams extends PaginationParams {
	seccion_id?: string;
	/** Productos de esa categoría o de cualquiera de sus subcategorías */
	categoria_id?: string;
	is_visible?: boolean;
	/** Coincidencias parciales (máx. 200 caracteres) */
	nombre?: string;
}

// ── Estado del formulario de alta: lo que escribe el usuario, todo como texto ────────────────────

export type ProductoImagenEstado = 'uploading' | 'ready' | 'error';

/** Una imagen elegida en el formulario: se sube al elegirla y solo entonces tiene `url` */
export interface ProductoFormImagen {
	/** Identificador local estable (no es el de la API) */
	key: string;
	/** Archivo original: permite reintentar la subida */
	file: File | null;
	/** URL temporal para la miniatura */
	preview: string;
	name: string;
	status: ProductoImagenEstado;
	/** URL devuelta por `POST /imagenes/uploads`; vacía hasta que termina de subir */
	url: string;
	tipo: ImagenTipo;
	/** Motivo del fallo cuando `status` es `error` */
	error: string;
}

export interface ProductoFormSku {
	key: string;
	talla_id: string;
	codigo_barras: string;
	is_visible: boolean;
	precio: { normal: string; rebajado: string; rebaja_hasta: string };
	stock: { cantidad: string; minimo: string };
}

export interface ProductoFormColor {
	key: string;
	color_id: string;
	is_visible: boolean;
	imagenes: ProductoFormImagen[];
	skus: ProductoFormSku[];
}

export interface ProductoFormValues {
	seccion_id: string;
	nombre: string;
	descripcion: string;
	cuidados: string;
	composicion: string;
	is_visible: boolean;
	categoria_ids: string[];
	colores: ProductoFormColor[];
}
