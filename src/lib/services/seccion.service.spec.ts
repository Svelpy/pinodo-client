import { beforeEach, describe, expect, it, vi } from 'vitest';

const { api } = vi.hoisted(() => ({
	api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }
}));

vi.mock('#lib/config/index.ts', () => ({ apiPinodo: api }));

import { seccionService } from './seccion.service';

const AUTH = { requireAuth: true };

describe('seccionService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('list pide todas las secciones sin paginación', async () => {
		await seccionService.list();
		expect(api.get).toHaveBeenCalledWith('/secciones/', AUTH);
	});

	it('list envía solo el filtro de visibilidad', async () => {
		await seccionService.list({ is_visible: false });
		expect(api.get).toHaveBeenCalledWith('/secciones/?is_visible=false', AUTH);

		await seccionService.list({ is_visible: true });
		expect(api.get).toHaveBeenLastCalledWith('/secciones/?is_visible=true', AUTH);
	});

	it('create, update y remove usan el endpoint de cada acción', async () => {
		const body = { nombre: 'Mujer', is_visible: true };
		await seccionService.create(body);
		expect(api.post).toHaveBeenCalledWith('/secciones/', body, AUTH);

		await seccionService.update('abc', { is_visible: false });
		expect(api.patch).toHaveBeenCalledWith('/secciones/abc', { is_visible: false }, AUTH);

		await seccionService.remove('abc');
		expect(api.delete).toHaveBeenCalledWith('/secciones/abc', undefined, AUTH);
	});
});
