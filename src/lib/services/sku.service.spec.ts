import { beforeEach, describe, expect, it, vi } from 'vitest';

const { api } = vi.hoisted(() => ({
	api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() }
}));

vi.mock('#lib/config/index.ts', () => ({ apiPinodo: api }));

import { skuService } from './sku.service';

const AUTH = { requireAuth: true };

describe('skuService.inventario', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('busca por nombre recortado y con la paginación indicada', async () => {
		await skuService.inventario({ nombre: '  camisa ', per_page: 100 });
		expect(api.get).toHaveBeenCalledWith(
			'/skus/inventario?page=1&per_page=100&nombre=camisa',
			AUTH
		);
	});

	it('busca por código de barras exacto y envía los filtros booleanos, también false', async () => {
		await skuService.inventario({
			codigo_barras: '8412345678905',
			en_rebaja: true,
			is_visible: false
		});
		expect(api.get).toHaveBeenCalledWith(
			'/skus/inventario?page=1&per_page=20&codigo_barras=8412345678905&is_visible=false&en_rebaja=true',
			AUTH
		);
	});

	it('no envía búsquedas vacías', async () => {
		await skuService.inventario({ nombre: '   ', codigo_barras: '' });
		expect(api.get).toHaveBeenCalledWith('/skus/inventario?page=1&per_page=20', AUTH);
	});
});
