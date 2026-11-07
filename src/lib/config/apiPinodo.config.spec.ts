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

import { apiPinodo } from './apiPinodo.config';

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
});
