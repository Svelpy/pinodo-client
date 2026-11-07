import { beforeEach, describe, expect, it, vi } from 'vitest';

const { api } = vi.hoisted(() => ({
	api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }
}));

vi.mock('#lib/config/index.ts', () => ({ apiPinodo: api }));

import { productoService } from './producto.service';

const AUTH = { requireAuth: true };

describe('productoService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('list pide la página, el tamaño y todos los filtros', async () => {
		await productoService.list({
			page: 2,
			per_page: 50,
			seccion_id: 'sec',
			categoria_id: 'cat',
			is_visible: false,
			nombre: '  camisa '
		});
		expect(api.get).toHaveBeenCalledWith(
			'/productos/?page=2&per_page=50&seccion_id=sec&categoria_id=cat&is_visible=false&nombre=camisa',
			AUTH
		);
	});

	it('list sin filtros usa la paginación por defecto y no envía filtros vacíos', async () => {
		await productoService.list({ nombre: '   ' });
		expect(api.get).toHaveBeenCalledWith('/productos/?page=1&per_page=20', AUTH);
	});

	it('get, create y remove usan el endpoint de cada acción', async () => {
		await productoService.get('abc');
		expect(api.get).toHaveBeenCalledWith('/productos/abc', AUTH);

		const body = {
			seccion_id: 'sec',
			nombre: 'Camisa',
			descripcion: null,
			cuidados: null,
			composicion: null,
			is_visible: true,
			categoria_ids: [],
			colores: []
		};
		await productoService.create(body);
		expect(api.post).toHaveBeenCalledWith('/productos/', body, AUTH);

		await productoService.remove('abc');
		expect(api.delete).toHaveBeenCalledWith('/productos/abc', undefined, AUTH);
	});

	it('no expone edición: la API no tiene PATCH de productos', () => {
		expect('update' in productoService).toBe(false);
	});
});
