import { beforeEach, describe, expect, it, vi } from 'vitest';

const { api } = vi.hoisted(() => ({
	api: { get: vi.fn(), getFile: vi.fn() }
}));

vi.mock('#lib/config/index.ts', () => ({ apiPinodo: api }));

import { finanzasService } from './finanzas.service';

const AUTH = { requireAuth: true };

describe('finanzasService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('ventas sin fechas pide toda la historia', async () => {
		await finanzasService.ventas();
		expect(api.get).toHaveBeenCalledWith('/finanzas/ventas', AUTH);
	});

	it('ventas envía el rango indicado', async () => {
		await finanzasService.ventas({ desde: '2026-10-01', hasta: '2026-11-13' });
		expect(api.get).toHaveBeenCalledWith(
			'/finanzas/ventas?desde=2026-10-01&hasta=2026-11-13',
			AUTH
		);
	});

	it('rentabilidad envía solo las fechas presentes', async () => {
		await finanzasService.rentabilidad({ hasta: '2026-11-13' });
		expect(api.get).toHaveBeenCalledWith('/finanzas/rentabilidad?hasta=2026-11-13', AUTH);
	});

	it('los Excel se descargan como archivo con el mismo rango', async () => {
		await finanzasService.ventasExcel({ desde: '2026-11-01' });
		expect(api.getFile).toHaveBeenCalledWith('/finanzas/ventas/excel?desde=2026-11-01', AUTH);

		await finanzasService.rentabilidadExcel();
		expect(api.getFile).toHaveBeenCalledWith('/finanzas/rentabilidad/excel', AUTH);
	});
});
