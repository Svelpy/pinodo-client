import type { PageLoad } from './$types';
import { cargarCatalogo } from '../catalogo';

// /buscar?q=…: búsqueda por nombre (la API admite hasta 100 caracteres)
export const load: PageLoad = async ({ fetch, url }) => {
	const q = (url.searchParams.get('q') ?? '').trim().slice(0, 100);
	if (!q) return { q, catalogo: null };
	return { q, catalogo: await cargarCatalogo(fetch, url, { q }) };
};
