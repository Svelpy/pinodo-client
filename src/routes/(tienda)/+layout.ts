import { error } from '@sveltejs/kit';
import type { TiendaConfigPublica, TiendaSeccion } from '#lib/interfaces/index.ts';
import { tiendaPublicaService } from '#lib/services/index.ts';
import type { LayoutLoad } from './$types';

// Tienda pública: SSR (endpoints sin autenticación) para SEO y vistas previas al compartir enlaces

export const load: LayoutLoad = async ({ fetch }) => {
	// En paralelo con la configuración; si el menú falla, la tienda se muestra igual sin él
	const navegacion = tiendaPublicaService.navegacion(fetch).catch(() => [] as TiendaSeccion[]);

	let tienda: TiendaConfigPublica;
	try {
		tienda = await tiendaPublicaService.config(fetch);
	} catch {
		error(503, 'No pudimos cargar la tienda. Inténtalo en unos minutos.');
	}

	// Tienda dada de baja (p. ej. mensualidad impaga): solo se muestra el aviso
	if (tienda.en_mantenimiento) {
		return { tienda, navegacion: [] as TiendaSeccion[], mantenimiento: true };
	}

	return { tienda, navegacion: await navegacion, mantenimiento: false };
};
