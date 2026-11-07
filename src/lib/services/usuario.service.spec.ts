import { beforeEach, describe, expect, it, vi } from 'vitest';

const { api } = vi.hoisted(() => ({
	api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() }
}));

vi.mock('#lib/config/index.ts', () => ({ apiPinodo: api }));

import { usuarioService } from './usuario.service';

const AUTH = { requireAuth: true };

describe('usuarioService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('list pide la página, el tamaño y el rol', async () => {
		await usuarioService.list({ rol: 'CAJERO', page: 2, per_page: 50 });
		expect(api.get).toHaveBeenCalledWith('/usuarios/?page=2&per_page=50&rol=CAJERO', AUTH);
	});

	it('list sin filtros usa la paginación por defecto y no envía rol', async () => {
		await usuarioService.list();
		expect(api.get).toHaveBeenCalledWith('/usuarios/?page=1&per_page=20', AUTH);
	});

	it('create, update, remove y resetPassword usan el endpoint de cada acción', async () => {
		const data = { nombre: 'Ana' };

		await usuarioService.update('abc', data);
		expect(api.patch).toHaveBeenCalledWith('/usuarios/abc', data, AUTH);

		await usuarioService.resetPassword('abc', { new_password: 'NuevaClave1' });
		expect(api.patch).toHaveBeenCalledWith(
			'/usuarios/abc/password',
			{ new_password: 'NuevaClave1' },
			AUTH
		);

		await usuarioService.remove('abc');
		expect(api.delete).toHaveBeenCalledWith('/usuarios/abc', undefined, AUTH);

		const body = {
			email: 'a@b.co',
			password: 'Clave123',
			nombre: 'Ana',
			apellidos: null,
			telefono: null,
			rol: 'ADMIN' as const
		};
		await usuarioService.create(body);
		expect(api.post).toHaveBeenCalledWith('/usuarios/', body, AUTH);
	});
});
