import { beforeEach, describe, expect, it, vi } from 'vitest';

const { api } = vi.hoisted(() => ({
	api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }
}));

vi.mock('#lib/config/index.ts', () => ({ apiPinodo: api }));

import { colorService } from './color.service';

const AUTH = { requireAuth: true };

describe('colorService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('list pide todos los colores sin paginación', async () => {
		await colorService.list();
		expect(api.get).toHaveBeenCalledWith('/colores/', AUTH);
	});

	it('create, update y remove usan el endpoint de cada acción', async () => {
		const body = { nombre: 'Azul marino', codigo_hex: '#1E3A8A' };
		await colorService.create(body);
		expect(api.post).toHaveBeenCalledWith('/colores/', body, AUTH);

		await colorService.update('abc', { codigo_hex: '#172554' });
		expect(api.patch).toHaveBeenCalledWith('/colores/abc', { codigo_hex: '#172554' }, AUTH);

		await colorService.remove('abc');
		expect(api.delete).toHaveBeenCalledWith('/colores/abc', undefined, AUTH);
	});
});
