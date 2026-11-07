import type { Seccion } from './seccion.interface';

/**
 * Categoría del catálogo. Pertenece a una sección y puede colgar de otra categoría de la misma
 * sección (`parent_id`); sin padre es una categoría raíz.
 */
export interface CategoriaItem {
	id: string;
	nombre: string;
	/** Se genera en la API a partir del nombre y es único dentro de la sección */
	slug: string;
	seccion_id: string;
	parent_id: string | null;
	is_visible: boolean;
	created_at: string;
	updated_at: string;
}

/** Respuesta de crear y actualizar: además de la categoría trae su sección y subcategorías */
export interface Categoria extends CategoriaItem {
	seccion: Seccion;
	subcategorias?: Categoria[];
}

/** Nodo del árbol: una categoría con sus subcategorías directas (a cualquier profundidad) */
export interface CategoriaArbolNodo {
	data: CategoriaItem;
	children: CategoriaArbolNodo[];
}

/** Una sección con su árbol de categorías (`GET /categorias/arbol`); puede venir sin categorías */
export interface SeccionArbol {
	seccion: Seccion;
	categorias: {
		/** Todas las categorías de la sección, de cualquier nivel */
		total: number;
		/** Categorías raíz con sus descendientes en `children` */
		data: CategoriaArbolNodo[];
	};
}

/** `POST /categorias/`: el padre, si se indica, debe ser de la misma sección y no tener productos */
export interface CreateCategoriaRequest {
	seccion_id: string;
	parent_id: string | null;
	nombre: string;
	is_visible: boolean;
}

/**
 * `PATCH /categorias/{id}`: solo se envían los campos modificados. `parent_id: null` la convierte
 * en raíz. Si cambia el nombre o la sección, el slug se regenera.
 */
export type UpdateCategoriaRequest = Partial<CreateCategoriaRequest>;

/** `GET /categorias/arbol` */
export interface ArbolCategoriasParams {
	/** Solo esa sección (404 si no existe); sin valor, todas */
	seccion_id?: string;
	/**
	 * Visibilidad efectiva: una categoría se ve solo si ella, todas sus categorías padre y su
	 * sección son visibles. Sin valor, todo.
	 */
	is_visible?: boolean;
}

/** Categoría como opción de un select: el texto es su ruta completa (p. ej. "Ropa › Bombers") */
export interface CategoriaOption {
	id: string;
	label: string;
}
