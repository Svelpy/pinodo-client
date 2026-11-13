import { beforeEach, describe, expect, it, vi } from 'vitest';

const { api } = vi.hoisted(() => ({
	api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() }
}));

vi.mock('#lib/config/index.ts', () => ({ apiPinodo: api }));

import { ventaService } from './venta.service';

const AUTH = { requireAuth: true };

describe('ventaService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('list sin filtros usa la paginación por defecto', async () => {
		await ventaService.list();
		expect(api.get).toHaveBeenCalledWith('/ventas/?page=1&per_page=20', AUTH);
	});

	it('list envía cada filtro indicado', async () => {
		await ventaService.list({
			page: 2,
			per_page: 50,
			estado: 'PENDIENTE',
			canal: 'WHATSAPP',
			metodo_pago: 'QR',
			created_by: 'u1',
			numero: 12,
			desde: '2026-11-01',
			hasta: '2026-11-10'
		});
		expect(api.get).toHaveBeenCalledWith(
			'/ventas/?page=2&per_page=50&estado=PENDIENTE&canal=WHATSAPP&metodo_pago=QR&created_by=u1&numero=12&desde=2026-11-01&hasta=2026-11-10',
			AUTH
		);
	});

	it('list ignora un número menor que 1', async () => {
		await ventaService.list({ numero: 0 });
		expect(api.get).toHaveBeenCalledWith('/ventas/?page=1&per_page=20', AUTH);
	});

	it('get, create y replaceItems usan su endpoint', async () => {
		await ventaService.get('v1');
		expect(api.get).toHaveBeenCalledWith('/ventas/v1', AUTH);

		const body = {
			canal: 'TIENDA' as const,
			referencia: null,
			cliente_telefono: null,
			descuento: 0,
			nota: null,
			items: [{ sku_id: 's1', cantidad: 2, descuento_unitario: 0 }],
			pagos: [{ metodo: 'EFECTIVO' as const, monto: 59.9 }]
		};
		await ventaService.create(body);
		expect(api.post).toHaveBeenCalledWith('/ventas/', body, AUTH);

		const items = { items: body.items, recalcular_precios: true };
		await ventaService.replaceItems('v1', items);
		expect(api.put).toHaveBeenCalledWith('/ventas/v1/items', items, AUTH);
	});

	it('confirmar envía los pagos y recalcular_precios solo si es true', async () => {
		const pagos = [
			{ metodo: 'EFECTIVO' as const, monto: 40 },
			{ metodo: 'QR' as const, monto: 20, referencia: '0048219' }
		];
		await ventaService.confirmar('v1', { pagos, recalcular_precios: true });
		expect(api.post).toHaveBeenLastCalledWith(
			'/ventas/v1/confirmar',
			{ pagos, recalcular_precios: true },
			AUTH
		);

		await ventaService.confirmar('v1', { pagos, recalcular_precios: false });
		expect(api.post).toHaveBeenLastCalledWith('/ventas/v1/confirmar', { pagos }, AUTH);
	});

	it('cancelar no envía cuerpo', async () => {
		await ventaService.cancelar('v1');
		expect(api.post).toHaveBeenLastCalledWith('/ventas/v1/cancelar', undefined, AUTH);
	});
});
