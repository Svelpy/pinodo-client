import { beforeEach, describe, expect, it, vi } from 'vitest';

const { api } = vi.hoisted(() => ({
	api: { get: vi.fn(), patch: vi.fn() }
}));

vi.mock('#lib/config/index.ts', () => ({ apiPinodo: api }));

import { tiendaService, toTiendaFormData } from './tienda.service';

describe('tiendaService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('get pide la configuración', async () => {
		await tiendaService.get();
		expect(api.get).toHaveBeenCalledWith('/config/');
	});

	it('update envía un multipart a /config/ con sesión', async () => {
		await tiendaService.update({ nombre_tienda: 'Nueva' });
		const [endpoint, body, options] = api.patch.mock.calls[0];
		expect(endpoint).toBe('/config/');
		expect(body).toBeInstanceOf(FormData);
		expect((body as FormData).get('nombre_tienda')).toBe('Nueva');
		expect(options).toEqual({ requireAuth: true });
	});
});

describe('toTiendaFormData', () => {
	it('null va vacío, los objetos como JSON, los booleanos como texto y los archivos tal cual', () => {
		const logo = new File(['x'], 'logo.png', { type: 'image/png' });
		const body = toTiendaFormData({
			ciudad: null,
			horario: { lunes: '09:00-20:00' },
			redes_sociales: {},
			eliminar_favicon: true,
			logo
		});

		expect(body.get('ciudad')).toBe('');
		expect(body.get('horario')).toBe('{"lunes":"09:00-20:00"}');
		expect(body.get('redes_sociales')).toBe('{}');
		expect(body.get('eliminar_favicon')).toBe('true');
		expect((body.get('logo') as File).name).toBe('logo.png');
	});

	it('no envía los campos ausentes', () => {
		expect([...toTiendaFormData({ telefono: '71234567' }).keys()]).toEqual(['telefono']);
	});
});
