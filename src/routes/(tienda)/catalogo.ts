import { error } from '@sveltejs/kit';
import type { TiendaAmbito, TiendaProductosQuery } from '#lib/interfaces/index.ts';
import { AppError, tiendaPublicaService } from '#lib/services/index.ts';
import { filtrosToQuery, paginaParam, parseFiltros, TIENDA_PER_PAGE } from '#lib/utils/index.ts';

/** Convierte un error de la API en la página de error de SvelteKit (404 o 503) */
export function errorTienda(err: unknown): never {
	if (err instanceof AppError && err.status === 404) {
		error(404, 'No encontramos lo que buscas.');
	}
	error(503, 'No pudimos cargar la tienda. Inténtalo en unos minutos.');
}

/**
 * Listado de productos con los filtros de la URL y las opciones de filtro del mismo ámbito.
 * Lo usan la home, las secciones, las categorías y la búsqueda.
 */
export async function cargarCatalogo(fetchFn: typeof fetch, url: URL, ambito: TiendaAmbito) {
	const filtros = parseFiltros(url.searchParams);
	const query: TiendaProductosQuery = {
		...ambito,
		...filtrosToQuery(filtros),
		per_page: TIENDA_PER_PAGE
	};

	try {
		const [productos, opciones] = await Promise.all([
			tiendaPublicaService.productos({ ...query, page: paginaParam(url.searchParams) }, fetchFn),
			// Sin opciones el listado igual funciona: el panel de filtros muestra solo orden y precio
			tiendaPublicaService.filtros(ambito, fetchFn).catch(() => null)
		]);
		return { productos, opciones, filtros, query };
	} catch (err) {
		errorTienda(err);
	}
}
