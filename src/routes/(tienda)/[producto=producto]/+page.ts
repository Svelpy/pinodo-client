import { error, redirect } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import { tiendaPublicaService } from '#lib/services/index.ts';
import { parseSlugId, slugIdParam } from '#lib/utils/index.ts';
import type { PageLoad } from './$types';
import { errorTienda } from '../catalogo';

// /{slug}-p{id}: el id manda; si el slug no coincide con el de la API se redirige al canónico
export const load: PageLoad = async ({ fetch, params, url, untrack }) => {
	const parsed = parseSlugId(params.producto, 'p');
	if (!parsed) error(404, 'No encontramos este producto.');

	let producto;
	try {
		producto = await tiendaPublicaService.producto(parsed.id, fetch);
	} catch (err) {
		errorTienda(err);
	}

	if (producto.slug !== parsed.slug) {
		const canonica = resolve('/(tienda)/[producto=producto]', {
			producto: slugIdParam(producto, 'p')
		});
		// untrack: el color elegido (?color=) no debe volver a pedir la ficha
		redirect(301, `${canonica}${untrack(() => url.search)}`);
	}

	return {
		producto,
		seccionActiva: producto.seccion.id,
		categoriaActiva: producto.categorias[0]?.id
	};
};
