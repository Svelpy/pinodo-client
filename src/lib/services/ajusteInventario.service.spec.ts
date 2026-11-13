import { beforeEach, describe, expect, it, vi } from 'vitest';

const { api } = vi.hoisted(() => ({
	api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() }
}));

vi.mock('#lib/config/index.ts', () => ({ apiPinodo: api }));

import { ajusteInventarioService } from './ajusteInventario.service';

const AUTH = { requireAuth: true };

describe('ajusteInventarioService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('create envía el ajuste a /ajustes-inventario/ y devuelve el resultado', async () => {
		const resultado = { ajuste: null, sin_diferencia: ['s1'] };
		api.post.mockResolvedValue(resultado);
		const body = {
			motivo: 'RECEPCION' as const,
			nota: 'Factura 4521',
			items: [{ sku_id: 's1', cantidad: 24, costo_unitario: 12.5 }]
		};
		await expect(ajusteInventarioService.create(body)).resolves.toEqual(resultado);
		expect(api.post).toHaveBeenCalledWith('/ajustes-inventario/', body, AUTH);
	});

	it('list sin filtros usa la paginación por defecto', async () => {
		await ajusteInventarioService.list();
		expect(api.get).toHaveBeenCalledWith('/ajustes-inventario/?page=1&per_page=20', AUTH);
	});

	it('list envía cada filtro indicado', async () => {
		await ajusteInventarioService.list({
			page: 2,
			per_page: 50,
			motivo: 'MERMA',
			created_by: 'u1',
			desde: '2026-11-01',
			hasta: '2026-11-10'
		});
		expect(api.get).toHaveBeenCalledWith(
			'/ajustes-inventario/?page=2&per_page=50&motivo=MERMA&created_by=u1&desde=2026-11-01&hasta=2026-11-10',
			AUTH
		);
	});

	it('get consulta un ajuste con sus líneas', async () => {
		await ajusteInventarioService.get('a1');
		expect(api.get).toHaveBeenCalledWith('/ajustes-inventario/a1', AUTH);
	});
});
