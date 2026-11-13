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
	/** Rango de precios normales (sin rebajas), para mostrar el precio tachado */
	precio_normal_desde: number | null;
	precio_normal_hasta: number | null;
	/** true si algún SKU tiene una rebaja vigente hoy */
	en_rebaja: boolean;
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
	/**
	 * Lo que cuesta cada prenda (≥ 0; la API usa 0 si se omite). El stock inicial entra al kardex
	 * como un INGRESO a este costo. No vuelve en la respuesta del SKU: se consulta en
	 * `GET /movimientos-inventario/costos`.
	 */
	costo?: number;
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

/**
 * `PATCH /productos/{id}`: solo los campos cambiados; los textos opcionales aceptan null para
 * borrarlos. `categoria_ids` reemplaza las categorías ([] quita todas); cambiar de sección sin
 * enviarlas quita todas, porque pertenecen a la sección anterior.
 */
export type UpdateProductoRequest = Partial<Omit<CreateProductoRequest, 'colores'>>;

/** `POST /producto-colores/`: añade un color (con imágenes y SKUs) a un producto existente */
export interface AddProductoColorRequest extends CreateProductoColorRequest {
	producto_id: string;
}

/**
 * Fila de un SKU existente en `PATCH /producto-colores/{id}`. La API exige siempre `talla_id` y el
 * `precio` completo (aunque no cambien: solo escribe lo que difiere); el resto solo si cambió. De
 * stock solo admite `minimo`: la cantidad entra y sale con un ajuste de inventario
 * (`POST /ajustes-inventario/`). `costo` corrige el costo promedio sin registrar un movimiento: solo
 * se envía si se cambió el costo que se cargó del kardex.
 */
export type UpdateProductoColorSkuRow = {
	id: string;
	talla_id: string;
	precio: ProductoPrecio;
} & Partial<Pick<CreateProductoSkuRequest, 'codigo_barras' | 'is_visible' | 'costo'>> & {
		stock?: { minimo: number };
	};

/**
 * `PATCH /producto-colores/{id}`: lo omitido no cambia. `imagenes` reemplaza la galería
 * (emparejando por url). En `skus`, una fila con `id` actualiza ese SKU y una sin `id` crea uno nuevo.
 */
export interface UpdateProductoColorRequest {
	color_id?: string;
	is_visible?: boolean;
	imagenes?: CreateProductoImagenRequest[];
	skus?: (UpdateProductoColorSkuRow | CreateProductoSkuRequest)[];
	/** Elimina esos SKUs y libera su talla y código de barras para las filas de la misma petición */
	sku_ids_eliminar?: string[];
}

/** `POST /skus/sugerir-codigo-barras` */
export interface SugerirCodigoBarrasResponse {
	/** EAN-13 de 13 dígitos */
	codigo_barras: string;
}

export interface ListProductosParams extends PaginationParams {
	seccion_id?: string;
	/** Productos de esa categoría o de cualquiera de sus subcategorías */
	categoria_id?: string;
	is_visible?: boolean;
	/** Coincidencias parciales (máx. 200 caracteres) */
	nombre?: string;
}

/** Qué se está editando en la ficha del producto (un editor a la vez); `colorId: null` = añadir */
export type ProductoFichaEdicion = { tipo: 'datos' } | { tipo: 'color'; colorId: string | null };

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
	/** Ya guardada en el producto (al editar): no tiene archivo y `preview` es su url */
	existing?: boolean;
}

export interface ProductoFormSku {
	key: string;
	/** Id del SKU ya guardado (al editar). Sin id es un SKU nuevo */
	id?: string;
	talla_id: string;
	codigo_barras: string;
	is_visible: boolean;
	precio: { normal: string; rebajado: string; rebaja_hasta: string };
	/** Costo por prenda. En uno nuevo, vacío = no se envía; en uno guardado, solo si cambió */
	costo: string;
	/**
	 * SKU guardado: su costo promedio según el kardex (la respuesta del SKU no lo trae).
	 * `undefined` = no se cargó, y entonces el costo no se puede editar; `null` = sin costo registrado.
	 */
	costo_actual?: number | null;
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
