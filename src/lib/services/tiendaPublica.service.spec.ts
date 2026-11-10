import { beforeEach, describe, expect, it, vi } from 'vitest';

const { api } = vi.hoisted(() => ({ api: { getPublic: vi.fn() } }));

vi.mock('#lib/config/index.ts', () => ({ apiPinodo: api }));

import { tiendaPublicaService, withQuery } from './tiendaPublica.service';

describe('withQuery', () => {
	it('omite vacíos, repite arrays y serializa booleanos y números', () => {
		expect(
			withQuery('/tienda/productos', {
				page: 2,
				q: '',
				seccion_id: undefined,
				categoria_id: null,
				color_id: ['a', 'b'],
				talla_id: [],
				disponible: true,
				en_rebaja: false,
				precio_min: 0
			})
		).toBe(
			'/tienda/productos?page=2&color_id=a&color_id=b&disponible=true&en_rebaja=false&precio_min=0'
		);
	});

	it('sin parámetros no agrega "?"', () => {
		expect(withQuery('/tienda/productos/filtros', {})).toBe('/tienda/productos/filtros');
	});
});

describe('tiendaPublicaService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('usa los endpoints públicos con el fetch del load', async () => {
		const loadFetch = vi.fn() as unknown as typeof fetch;

		await tiendaPublicaService.config(loadFetch);
		expect(api.getPublic).toHaveBeenCalledWith('/tienda/config', { fetch: loadFetch });

		await tiendaPublicaService.productos({ categoria_id: 'c1', page: 1 }, loadFetch);
		expect(api.getPublic).toHaveBeenCalledWith('/tienda/productos?categoria_id=c1&page=1', {
			fetch: loadFetch
		});

		await tiendaPublicaService.producto('p1');
		expect(api.getPublic).toHaveBeenCalledWith('/tienda/productos/p1', { fetch: undefined });
	});
});
