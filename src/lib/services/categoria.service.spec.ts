import { beforeEach, describe, expect, it, vi } from 'vitest';

const { api } = vi.hoisted(() => ({
	api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }
}));

vi.mock('#lib/config/index.ts', () => ({ apiPinodo: api }));

import { categoriaService } from './categoria.service';

const AUTH = { requireAuth: true };

describe('categoriaService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('arbol pide el árbol de todas las secciones sin filtros ni paginación', async () => {
		await categoriaService.arbol();
		expect(api.get).toHaveBeenCalledWith('/categorias/arbol', AUTH);
	});

	it('arbol envía la sección y la visibilidad', async () => {
		await categoriaService.arbol({ seccion_id: 'sec', is_visible: false });
		expect(api.get).toHaveBeenCalledWith('/categorias/arbol?seccion_id=sec&is_visible=false', AUTH);

		await categoriaService.arbol({ is_visible: true });
		expect(api.get).toHaveBeenLastCalledWith('/categorias/arbol?is_visible=true', AUTH);
	});

	it('create, update y remove usan el endpoint de cada acción', async () => {
		const body = { seccion_id: 'sec', parent_id: null, nombre: 'Bombers', is_visible: true };
		await categoriaService.create(body);
		expect(api.post).toHaveBeenCalledWith('/categorias/', body, AUTH);

		await categoriaService.update('abc', { parent_id: null });
		expect(api.patch).toHaveBeenCalledWith('/categorias/abc', { parent_id: null }, AUTH);

		await categoriaService.remove('abc');
		expect(api.delete).toHaveBeenCalledWith('/categorias/abc', undefined, AUTH);
	});
});
