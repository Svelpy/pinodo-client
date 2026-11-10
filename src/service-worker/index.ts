import { self } from '$app/service-worker';
import { assets, immutable, prerendered } from '$app/manifest';
import { version } from '$app/env';
import { asset } from '$app/paths';

// Cada build trae una versión nueva: el navegador nota que el worker cambió y lo reinstala
const CACHE = `cache-${version}`;

// JS/CSS de la app (con hash en el nombre), archivos de `static/` y páginas prerenderizadas.
// Las rutas del manifest son relativas al sitio: se resuelven desde el scope del worker
const PRECACHE = [...immutable, ...assets, ...prerendered].map(
	({ path }) => new URL(path, self.registration.scope).pathname
);
const PRECACHED = new Set(PRECACHE);

self.addEventListener('install', (event) => {
	// La versión nueva toma el control apenas se instala, sin esperar a que se cierre la app
	self.skipWaiting();
	event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			for (const key of await caches.keys()) {
				if (key !== CACHE) await caches.delete(key);
			}
			await self.clients.claim();
		})()
	);
});

self.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;

	// Solo archivos del propio sitio. La API (otro dominio) no pasa por la caché: los puntos y
	// movimientos siempre se leen al día y los datos del usuario no quedan guardados en el teléfono
	const url = new URL(request.url);
	if (url.origin !== self.location.origin) return;

	if (PRECACHED.has(url.pathname)) {
		event.respondWith(fromCache(request, url.pathname));
	} else if (request.mode === 'navigate') {
		event.respondWith(fromNetwork(event, url.pathname));
	}
	// Lo demás (p. ej. `_app/version.json`, con el que SvelteKit detecta versiones nuevas) va a la red
});

/** Archivos de esta versión: desde la caché, sin esperar a la red */
async function fromCache(request: Request, pathname: string): Promise<Response> {
	const cache = await caches.open(CACHE);
	return (await cache.match(pathname)) ?? fetch(request);
}

/**
 * Páginas: siempre desde la red, así al abrir la app se carga la última versión publicada.
 * Sin conexión, la última copia guardada de esa página o, si no hay, el aviso de sin conexión.
 */
async function fromNetwork(event: FetchEvent, pathname: string): Promise<Response> {
	const cache = await caches.open(CACHE);
	try {
		const response = await fetch(event.request);
		if (response.ok && response.type === 'basic') {
			event.waitUntil(cache.put(pathname, response.clone()));
		}
		return response;
	} catch {
		return (await cache.match(pathname)) ?? offlinePage();
	}
}

function offlinePage(): Response {
	const html = `<!doctype html>
<html lang="es">
<head>
	<meta charset="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
	<meta name="theme-color" content="#ffffff" />
	<title>Sin conexión</title>
	<style>
		body { margin: 0; min-height: 100dvh; display: grid; place-items: center; padding: 24px; box-sizing: border-box; background: #fff; color: #0f1f38; font-family: system-ui, sans-serif; text-align: center; }
		h1 { margin: 24px 0 8px; font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.12em; }
		p { margin: 0 0 24px; opacity: 0.8; }
		button { font: inherit; font-weight: 600; padding: 12px 24px; border: 1px solid currentColor; background: #0f1f38; color: #fff; cursor: pointer; text-transform: uppercase; letter-spacing: 0.12em; font-size: 0.75rem; }
	</style>
</head>
<body>
	<main>
		<img src="${asset('icons/icon-192.png')}" alt="" width="96" height="96" />
		<h1>Sin conexión</h1>
		<p>Revisa tu conexión a internet e inténtalo de nuevo.</p>
		<button type="button" onclick="location.reload()">Reintentar</button>
	</main>
</body>
</html>`;

	return new Response(html, {
		status: 503,
		headers: { 'Content-Type': 'text/html; charset=utf-8' }
	});
}
