import { apiPinodo } from '#lib/config/index.ts';
import type {
	PaginatedResponse,
	TiendaAmbito,
	TiendaConfigPublica,
	TiendaFiltrosOpciones,
	TiendaProducto,
	TiendaProductoDetalle,
	TiendaProductosQuery,
	TiendaSeccion
} from '#lib/interfaces/index.ts';

type QueryValue = string | number | boolean | null | undefined | readonly string[];

/**
 * Endpoint con query string. Omite valores vacíos (undefined, null, '' o arrays vacíos) y repite
 * la clave en los arrays (`?color_id=a&color_id=b`), como espera la API.
 */
export function withQuery(endpoint: string, params: object = {}): string {
	const query = new URLSearchParams();
	for (const [key, value] of Object.entries(params) as [string, QueryValue][]) {
		if (value === undefined || value === null || value === '') continue;
		if (Array.isArray(value)) value.forEach((item) => query.append(key, String(item)));
		else query.set(key, String(value));
	}
	return query.size > 0 ? `${endpoint}?${query}` : endpoint;
}

/**
 * Catálogo público de la tienda (`/tienda/*`, sin autenticación). Cada método recibe el `fetch`
 * del `load` para que funcione en SSR; en el navegador basta el `fetch` global.
 */
class TiendaPublicaService {
	/** Datos de la tienda. Responde aunque esté en mantenimiento (`en_mantenimiento`) */
	config(fetch?: typeof globalThis.fetch): Promise<TiendaConfigPublica> {
		return apiPinodo.getPublic<TiendaConfigPublica>('/tienda/config', { fetch });
	}

	/** Secciones visibles con su árbol de categorías visibles */
	navegacion(fetch?: typeof globalThis.fetch): Promise<TiendaSeccion[]> {
		return apiPinodo.getPublic<TiendaSeccion[]>('/tienda/navegacion', { fetch });
	}

	/** Productos visibles (los agotados también, con `agotado`). 404 si la sección/categoría no es visible */
	productos(
		query: TiendaProductosQuery = {},
		fetch?: typeof globalThis.fetch
	): Promise<PaginatedResponse<TiendaProducto>> {
		return apiPinodo.getPublic<PaginatedResponse<TiendaProducto>>(
			withQuery('/tienda/productos', query),
			{ fetch }
		);
	}

	/** Colores, tallas, rango de precios y rebajas disponibles en el ámbito indicado */
	filtros(
		ambito: TiendaAmbito = {},
		fetch?: typeof globalThis.fetch
	): Promise<TiendaFiltrosOpciones> {
		return apiPinodo.getPublic<TiendaFiltrosOpciones>(
			withQuery('/tienda/productos/filtros', ambito),
			{ fetch }
		);
	}

	/** Ficha de producto. Si el slug de la URL no coincide, se redirige al canónico */
	producto(id: string, fetch?: typeof globalThis.fetch): Promise<TiendaProductoDetalle> {
		return apiPinodo.getPublic<TiendaProductoDetalle>(
			`/tienda/productos/${encodeURIComponent(id)}`,
			{ fetch }
		);
	}
}

export const tiendaPublicaService = new TiendaPublicaService();
