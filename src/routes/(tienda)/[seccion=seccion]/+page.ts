import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';
import { cargarCatalogo } from '../catalogo';

// /{slug}: la sección se resuelve por slug desde el menú (solo hay secciones visibles)
export const load: PageLoad = async ({ fetch, url, params, parent }) => {
	const { navegacion, mantenimiento } = await parent();
	if (mantenimiento) error(503, 'Tienda no disponible');

	const seccion = navegacion.find((s) => s.slug === params.seccion);
	if (!seccion) error(404, 'No encontramos esta sección.');

	const catalogo = await cargarCatalogo(fetch, url, { seccion_id: seccion.id });
	return { ...catalogo, seccion, seccionActiva: seccion.id };
};
