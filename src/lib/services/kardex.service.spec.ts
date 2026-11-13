import { beforeEach, describe, expect, it, vi } from 'vitest';

const { api } = vi.hoisted(() => ({
	api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() }
}));

vi.mock('#lib/config/index.ts', () => ({ apiPinodo: api }));

import { kardexService } from './kardex.service';

const AUTH = { requireAuth: true };

describe('kardexService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('list sin filtros usa la paginación por defecto', async () => {
		await kardexService.list();
		expect(api.get).toHaveBeenCalledWith('/movimientos-inventario/?page=1&per_page=20', AUTH);
	});

	it('list envía cada filtro indicado', async () => {
		await kardexService.list({
			page: 2,
			per_page: 50,
			sku_id: 's1',
			tipo: 'VENTA',
			venta_id: 'v1',
			created_by: 'u1',
			desde: '2026-11-01',
			hasta: '2026-11-10'
		});
		expect(api.get).toHaveBeenCalledWith(
			'/movimientos-inventario/?page=2&per_page=50&sku_id=s1&tipo=VENTA&venta_id=v1&created_by=u1&desde=2026-11-01&hasta=2026-11-10',
			AUTH
		);
	});

	it('costos recorta la búsqueda y omite los filtros vacíos', async () => {
		await kardexService.costos({ nombre: '  camisa ', codigo_barras: '   ' });
		expect(api.get).toHaveBeenCalledWith(
			'/movimientos-inventario/costos?page=1&per_page=20&nombre=camisa',
			AUTH
		);
	});

	it('costos envía cada filtro indicado', async () => {
		await kardexService.costos({
			page: 3,
			per_page: 100,
			nombre: 'Oxford',
			codigo_barras: '8412345678905',
			producto_id: 'p1',
			color_id: 'c1'
		});
		expect(api.get).toHaveBeenCalledWith(
			'/movimientos-inventario/costos?page=3&per_page=100&nombre=Oxford&codigo_barras=8412345678905&producto_id=p1&color_id=c1',
			AUTH
		);
	});

	it('get consulta un movimiento', async () => {
		await kardexService.get('m1');
		expect(api.get).toHaveBeenCalledWith('/movimientos-inventario/m1', AUTH);
	});
});
