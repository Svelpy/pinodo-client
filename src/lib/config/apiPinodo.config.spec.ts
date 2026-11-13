import { beforeEach, describe, expect, it, vi } from 'vitest';

const { auth, fetchMock } = vi.hoisted(() => ({
	auth: { getToken: vi.fn(), expireSession: vi.fn(), refreshToken: vi.fn() },
	fetchMock: vi.fn()
}));

vi.mock('#lib/services/index.ts', () => {
	class AppError extends Error {
		code?: string;
		status?: number;
		constructor({ message, code, status }: { message: string; code?: string; status?: number }) {
			super(message);
			this.code = code;
			this.status = status;
		}
	}
	return {
		AppError,
		authService: auth,
		errorService: { fromUnknown: (error: unknown) => error, fromResponse: vi.fn(), log: vi.fn() }
	};
});

import { apiPinodo, filenameFromContentDisposition } from './apiPinodo.config';

describe('apiPinodo sin token', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubGlobal('fetch', fetchMock);
		auth.getToken.mockReturnValue(null);
	});

	it('una petición con requireAuth cierra la sesión y no llega a la red', async () => {
		await expect(apiPinodo.get('/usuarios/', { requireAuth: true })).rejects.toMatchObject({
			status: 401
		});

		expect(auth.expireSession).toHaveBeenCalledTimes(1);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('una petición pública no toca la sesión', async () => {
		fetchMock.mockResolvedValue(new Response('{}', { status: 200 }));

		await apiPinodo.getPublic('/config/');

		expect(auth.expireSession).not.toHaveBeenCalled();
	});

	it('una petición pública usa el fetch indicado (load con SSR) y no envía token', async () => {
		auth.getToken.mockReturnValue('token');
		const loadFetch = vi.fn(async () => new Response('{"ok":1}', { status: 200 }));

		await expect(apiPinodo.getPublic('/tienda/config', { fetch: loadFetch })).resolves.toEqual({
			ok: 1
		});

		expect(fetchMock).not.toHaveBeenCalled();
		const [, init] = loadFetch.mock.calls[0] as unknown as [string, RequestInit];
		expect(init.headers).not.toHaveProperty('Authorization');
	});
});

describe('apiPinodo.getFile', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubGlobal('fetch', fetchMock);
		auth.getToken.mockReturnValue('token');
	});

	it('devuelve el archivo con el nombre que propone la API y envía el token', async () => {
		fetchMock.mockResolvedValue(
			new Response('xlsx', {
				status: 200,
				headers: { 'Content-Disposition': 'attachment; filename="ventas.xlsx"' }
			})
		);

		const archivo = await apiPinodo.getFile('/finanzas/ventas/excel', { requireAuth: true });

		expect(await archivo.blob.text()).toBe('xlsx');
		expect(archivo.filename).toBe('ventas.xlsx');
		const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
		expect(init.headers).toHaveProperty('Authorization', 'Bearer token');
	});

	it('con el token vencido lo renueva y reintenta una vez', async () => {
		auth.refreshToken.mockResolvedValue('nuevo');
		fetchMock
			.mockResolvedValueOnce(new Response('', { status: 401 }))
			.mockResolvedValueOnce(new Response('xlsx', { status: 200 }));

		const archivo = await apiPinodo.getFile('/finanzas/ventas/excel', { requireAuth: true });

		expect(auth.refreshToken).toHaveBeenCalledWith('token');
		expect(fetchMock).toHaveBeenCalledTimes(2);
		expect(archivo.filename).toBeNull();
	});
});

describe('filenameFromContentDisposition', () => {
	it.each([
		['attachment; filename="reporte.xlsx"', 'reporte.xlsx'],
		['attachment; filename=reporte.xlsx', 'reporte.xlsx'],
		[
			'attachment; filename="reporte.xlsx"; filename*=UTF-8\'\'reporte%20de%20ventas.xlsx',
			'reporte de ventas.xlsx'
		],
		['inline', null],
		[null, null]
	])('%s → %s', (header, expected) => {
		expect(filenameFromContentDisposition(header)).toBe(expected);
	});
});
