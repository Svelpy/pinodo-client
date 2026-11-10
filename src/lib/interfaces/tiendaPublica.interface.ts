/**
 * Tienda pública (endpoints `/tienda/*`, sin autenticación).
 * Prefijo `Tienda*` para no confundirlos con los tipos del panel (`Producto`, `Color`…).
 */

/** `GET /tienda/config`: datos de la tienda. Con `en_mantenimiento` la tienda no se muestra */
export interface TiendaConfigPublica {
	nombre_tienda: string;
	descripcion: string | null;
	logo_url: string | null;
	favicon_url: string | null;
	email_contacto: string | null;
	telefono: string | null;
	whatsapp: string | null;
	direccion: string | null;
	map_url: string | null;
	ciudad: string | null;
	horario: Record<string, string> | null;
	redes_sociales: Record<string, string> | null;
	en_mantenimiento: boolean;
}

/** Referencia mínima a una sección o categoría */
export interface TiendaRef {
	id: string;
	nombre: string;
	slug: string;
}

/** Nodo del árbol de categorías visibles */
export interface TiendaCategoriaNodo {
	data: TiendaRef;
	children: TiendaCategoriaNodo[];
}

/** `GET /tienda/navegacion`: sección visible con su árbol de categorías */
export interface TiendaSeccion extends TiendaRef {
	categorias: { total: number; data: TiendaCategoriaNodo[] };
}

export interface TiendaColor {
	id: string;
	nombre: string;
	codigo_hex: string | null;
}

export interface TiendaTalla {
	id: string;
	etiqueta: string;
}

/** Precios vigentes hoy y normales (sin rebaja), como rango entre las tallas */
export interface TiendaPrecios {
	precio_desde: number;
	precio_hasta: number;
	precio_normal_desde: number;
	precio_normal_hasta: number;
	en_rebaja: boolean;
	agotado: boolean;
}

/** Producto del listado (`GET /tienda/productos`) */
export interface TiendaProducto extends TiendaPrecios {
	id: string;
	slug: string;
	nombre: string;
	portada_url: string | null;
	colores: TiendaColor[];
}

export interface TiendaImagen {
	url: string;
	tipo: string;
}

export interface TiendaSku {
	id: string;
	talla: TiendaTalla;
	precio_normal: number;
	precio_vigente: number;
	en_rebaja: boolean;
	rebaja_hasta: string | null;
	disponible: boolean;
}

/** Color de la ficha con sus imágenes y tallas visibles */
export interface TiendaProductoColor {
	id: string;
	color: TiendaColor;
	agotado: boolean;
	imagenes: TiendaImagen[];
	skus: TiendaSku[];
}

/** Ficha de producto (`GET /tienda/productos/{id}`) */
export interface TiendaProductoDetalle extends TiendaPrecios {
	id: string;
	slug: string;
	nombre: string;
	descripcion: string | null;
	cuidados: string | null;
	composicion: string | null;
	seccion: TiendaRef;
	categorias: TiendaRef[];
	colores: TiendaProductoColor[];
}

/** `GET /tienda/productos/filtros`: opciones que devuelven resultados */
export interface TiendaFiltrosOpciones {
	colores: TiendaColor[];
	tallas: TiendaTalla[];
	precio_min: number | null;
	precio_max: number | null;
	hay_rebajas: boolean;
}

export type TiendaOrden = 'NOVEDADES' | 'PRECIO_ASC' | 'PRECIO_DESC';

/** Ámbito del listado: lo comparten `/tienda/productos` y `/tienda/productos/filtros` */
export interface TiendaAmbito {
	seccion_id?: string;
	categoria_id?: string;
	q?: string;
}

/** Query de `GET /tienda/productos` */
export interface TiendaProductosQuery extends TiendaAmbito {
	page?: number;
	per_page?: number;
	orden?: TiendaOrden;
	color_id?: string[];
	talla_id?: string[];
	disponible?: boolean;
	en_rebaja?: boolean;
	precio_min?: number;
	precio_max?: number;
}

/** Filtros tal como viven en la URL de la tienda (compartibles) */
export interface TiendaFiltros {
	orden: TiendaOrden;
	colores: string[];
	tallas: string[];
	disponible: boolean;
	rebaja: boolean;
	min: number | null;
	max: number | null;
}

/** Línea de la cesta (se guarda en localStorage) */
export interface CestaItem {
	sku_id: string;
	producto_id: string;
	slug: string;
	nombre: string;
	color: string;
	color_id: string;
	talla: string;
	precio: number;
	precio_normal: number;
	imagen: string | null;
	cantidad: number;
	/** true si la última ficha consultada indica que ya no hay stock */
	agotado?: boolean;
}
