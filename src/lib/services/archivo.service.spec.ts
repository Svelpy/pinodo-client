import { beforeEach, describe, expect, it, vi } from 'vitest';

const { api } = vi.hoisted(() => ({
	api: { get: vi.fn(), delete: vi.fn() }
}));

vi.mock('#lib/config/index.ts', () => ({ apiPinodo: api }));

import { archivoService } from './archivo.service';

const AUTH = { requireAuth: true };

describe('archivoService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('list sin filtros usa la paginación por defecto', async () => {
		await archivoService.list();
		expect(api.get).toHaveBeenCalledWith('/imagenes/biblioteca?page=1&per_page=20', AUTH);
	});

	it('list envía la página, el tamaño y los filtros', async () => {
		await archivoService.list({
			page: 3,
			per_page: 50,
			tipo: 'PRENDA',
			nombre: 'camisa',
			producto_id: 'p1',
			color_id: 'c1'
		});
		const [endpoint] = api.get.mock.calls[0];
		const query = new URLSearchParams(endpoint.split('?')[1]);
		expect(endpoint.startsWith('/imagenes/biblioteca?')).toBe(true);
		expect(Object.fromEntries(query)).toEqual({
			page: '3',
			per_page: '50',
			tipo: 'PRENDA',
			nombre: 'camisa',
			producto_id: 'p1',
			color_id: 'c1'
		});
	});

	it('list recorta la búsqueda y no envía filtros vacíos', async () => {
		await archivoService.list({ nombre: '   ', tipo: undefined });
		expect(api.get).toHaveBeenCalledWith('/imagenes/biblioteca?page=1&per_page=20', AUTH);

		await archivoService.list({ nombre: '  polo  ' });
		expect(api.get).toHaveBeenLastCalledWith(
			'/imagenes/biblioteca?page=1&per_page=20&nombre=polo',
			AUTH
		);
	});

	it('remove elimina la imagen por id', async () => {
		await archivoService.remove('img-1');
		expect(api.delete).toHaveBeenCalledWith('/imagenes/img-1', undefined, AUTH);
	});
});
