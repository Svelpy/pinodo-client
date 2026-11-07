import { beforeEach, describe, expect, it, vi } from 'vitest';

const { api } = vi.hoisted(() => ({
	api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }
}));

vi.mock('#lib/config/index.ts', () => ({ apiPinodo: api }));

import { tallaService } from './talla.service';

const AUTH = { requireAuth: true };

describe('tallaService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('list pide todas las tallas sin paginación', async () => {
		await tallaService.list();
		expect(api.get).toHaveBeenCalledWith('/tallas/', AUTH);
	});

	it('create, update y remove usan el endpoint de cada acción', async () => {
		await tallaService.create({ etiqueta: 'M' });
		expect(api.post).toHaveBeenCalledWith('/tallas/', { etiqueta: 'M' }, AUTH);

		await tallaService.update('abc', { etiqueta: '6-7 años' });
		expect(api.patch).toHaveBeenCalledWith('/tallas/abc', { etiqueta: '6-7 años' }, AUTH);

		await tallaService.remove('abc');
		expect(api.delete).toHaveBeenCalledWith('/tallas/abc', undefined, AUTH);
	});
});
