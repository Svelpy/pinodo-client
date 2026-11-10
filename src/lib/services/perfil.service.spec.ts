import { beforeEach, describe, expect, it, vi } from 'vitest';

const { api } = vi.hoisted(() => ({
	api: { patch: vi.fn() }
}));

vi.mock('#lib/config/index.ts', () => ({ apiPinodo: api }));

import { perfilService } from './perfil.service';

const AUTH = { requireAuth: true };

describe('perfilService', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('update envía solo los datos recibidos a /usuarios/me', async () => {
		await perfilService.update({ telefono: null });
		expect(api.patch).toHaveBeenCalledWith('/usuarios/me', { telefono: null }, AUTH);
	});

	it('changePassword envía la actual y la nueva a /usuarios/me/password', async () => {
		const data = { current_password: 'Actual123', new_password: 'Nueva123' };
		await perfilService.changePassword(data);
		expect(api.patch).toHaveBeenCalledWith('/usuarios/me/password', data, AUTH);
	});
});
