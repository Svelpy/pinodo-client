import { asset } from '$app/paths';
import { APP_SITE_CONFIG } from '#lib/constants/index.ts';
import { tiendaPublicaService } from '#lib/services/index.ts';
import type { RequestHandler } from './$types';

/**
 * Manifest de la PWA con el nombre y la descripción de la tienda (`GET /tienda/config`), para que al
 * instalarla en el teléfono aparezca como la tienda y no como la plataforma. Si la API no responde
 * se usa el nombre de la plataforma; los íconos son los de `static/icons`.
 */
export const GET: RequestHandler = async ({ fetch }) => {
	const tienda = await tiendaPublicaService.config(fetch).catch(() => null);
	const nombre = tienda?.nombre_tienda ?? APP_SITE_CONFIG.APP_NAME;

	const manifest = {
		id: '/',
		name: nombre,
		short_name: nombre.length > 12 ? nombre.slice(0, 12).trim() : nombre,
		description: tienda?.descripcion ?? `Catálogo en línea de ${nombre}.`,
		lang: 'es',
		dir: 'ltr',
		start_url: '/',
		scope: '/',
		display: 'standalone',
		background_color: '#ffffff',
		theme_color: '#ffffff',
		categories: ['shopping', 'lifestyle'],
		icons: [
			{ src: asset('icons/icon-192.png'), type: 'image/png', sizes: '192x192', purpose: 'any' },
			{ src: asset('icons/icon-512.png'), type: 'image/png', sizes: '512x512', purpose: 'any' },
			{
				src: asset('icons/icon-maskable-512.png'),
				type: 'image/png',
				sizes: '512x512',
				purpose: 'maskable'
			}
		]
	};

	return new Response(JSON.stringify(manifest), {
		headers: {
			'Content-Type': 'application/manifest+json; charset=utf-8',
			// Los cambios de nombre en "Mi negocio" se reflejan en minutos
			'Cache-Control': 'public, max-age=600'
		}
	});
};
