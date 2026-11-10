import { error, redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { parseSlugId, slugIdParam, ubicarCategoria } from '#lib/utils/index.ts';
import type { PageLoad } from './$types';
import { cargarCatalogo } from '../catalogo';

// /{slug}-l{id}: el id manda; si el slug cambió se redirige a la URL canónica
export const load: PageLoad = async ({ fetch, url, params, parent }) => {
	const parsed = parseSlugId(params.categoria, 'l');
	if (!parsed) error(404, 'No encontramos esta categoría.');

	const [{ navegacion, mantenimiento }, catalogo] = await Promise.all([
		parent(),
		cargarCatalogo(fetch, url, { categoria_id: parsed.id })
	]);
	if (mantenimiento) error(503, 'Tienda no disponible');

	const ubicacion = ubicarCategoria(navegacion, parsed.id);
	if (!ubicacion) error(404, 'No encontramos esta categoría.');

	const categoria = ubicacion.nodo.data;
	if (categoria.slug !== parsed.slug) {
		const canonica = resolve('/(tienda)/[categoria=categoria]', {
			categoria: slugIdParam(categoria, 'l')
		});
		redirect(301, `${canonica}${url.search}`);
	}

	return {
		...catalogo,
		categoria,
		ubicacion,
		seccionActiva: ubicacion.seccion.id,
		categoriaActiva: categoria.id
	};
};
