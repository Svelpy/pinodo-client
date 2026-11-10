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
			estado: 'CONFIRMADA' as const,
			canal: 'TIENDA' as const,
			metodo_pago: 'EFECTIVO' as const,
			referencia: null,
			cliente_telefono: null,
			descuento: 0,
			nota: null,
			items: [{ sku_id: 's1', cantidad: 2, descuento_unitario: 0 }]
		};
		await ventaService.create(body);
		expect(api.post).toHaveBeenCalledWith('/ventas/', body, AUTH);

		const items = { items: body.items, recalcular_precios: true };
		await ventaService.replaceItems('v1', items);
		expect(api.put).toHaveBeenCalledWith('/ventas/v1/items', items, AUTH);
	});

	it('cambiarEstado envía recalcular_precios solo al confirmar con true', async () => {
		await ventaService.cambiarEstado('v1', { estado: 'CONFIRMADA', recalcular_precios: true });
		expect(api.patch).toHaveBeenLastCalledWith(
			'/ventas/v1/estado',
			{ estado: 'CONFIRMADA', recalcular_precios: true },
			AUTH
		);

		await ventaService.cambiarEstado('v1', { estado: 'CONFIRMADA', recalcular_precios: false });
		expect(api.patch).toHaveBeenLastCalledWith('/ventas/v1/estado', { estado: 'CONFIRMADA' }, AUTH);

		await ventaService.cambiarEstado('v1', { estado: 'CANCELADA' });
		expect(api.patch).toHaveBeenLastCalledWith('/ventas/v1/estado', { estado: 'CANCELADA' }, AUTH);
	});
});
