import type { PageLoad } from './$types';
import { cargarCatalogo } from './catalogo';

// Home: todo el catálogo visible, novedades primero
export const load: PageLoad = async ({ fetch, url }) => cargarCatalogo(fetch, url, {});
