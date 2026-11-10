import { beforeEach, describe, expect, it, vi } from 'vitest';

const { api } = vi.hoisted(() => ({
	api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }
}));

vi.mock('#lib/config/index.ts', () => ({ apiPinodo: api }));

import { productoColorService } from './productoColor.service';
import { skuService } from './sku.service';

const AUTH = { requireAuth: true };

describe('productoColorService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('create, update y remove usan el endpoint de cada acción', async () => {
		const body = {
			producto_id: 'prod',
			color_id: 'col',
			is_visible: true,
			imagenes: [],
			skus: []
		};
		await productoColorService.create(body);
		expect(api.post).toHaveBeenCalledWith('/producto-colores/', body, AUTH);

		const patch = { is_visible: false, sku_ids_eliminar: ['s1'] };
		await productoColorService.update('pc', patch);
		expect(api.patch).toHaveBeenCalledWith('/producto-colores/pc', patch, AUTH);

		await productoColorService.remove('pc');
		expect(api.delete).toHaveBeenCalledWith('/producto-colores/pc', undefined, AUTH);
	});
});

describe('skuService', () => {
	it('update envía solo lo cambiado del SKU', async () => {
		await skuService.update('sku', { precio: { rebajado: null } });
		expect(api.patch).toHaveBeenCalledWith('/skus/sku', { precio: { rebajado: null } }, AUTH);
	});

	it('ajustarStock usa el endpoint de stock con el ajuste y/o el mínimo', async () => {
		await skuService.ajustarStock('sku', { ajuste: -2, minimo: 4 });
		expect(api.patch).toHaveBeenCalledWith('/skus/sku/stock', { ajuste: -2, minimo: 4 }, AUTH);
	});

	it('sugerirCodigoBarras hace un POST sin body', async () => {
		api.post.mockResolvedValue({ codigo_barras: '2001234567893' });
		await expect(skuService.sugerirCodigoBarras()).resolves.toEqual({
			codigo_barras: '2001234567893'
		});
		expect(api.post).toHaveBeenCalledWith('/skus/sugerir-codigo-barras', undefined, AUTH);
	});
});
