import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('#lib/config/index.ts', () => ({ apiPinodo: {} }));

import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_DATA_KEY } from '#lib/constants/index.ts';
import { authService } from './auth.service';

function stubLocalStorage(initial: Record<string, string>) {
	const data = new Map(Object.entries(initial));
	vi.stubGlobal('localStorage', {
		getItem: (key: string) => data.get(key) ?? null,
		setItem: (key: string, value: string) => void data.set(key, value),
		removeItem: (key: string) => void data.delete(key)
	});
	return data;
}

describe('authService.expireSession', () => {
	beforeEach(() => {
		stubLocalStorage({
			[ACCESS_TOKEN_KEY]: 'at',
			[REFRESH_TOKEN_KEY]: 'csrf',
			[USER_DATA_KEY]: '{}'
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('borra las keys de auth y avisa a los suscriptores', () => {
		const listener = vi.fn();
		const unsubscribe = authService.onSessionExpired(listener);

		authService.expireSession();

		expect(authService.getToken()).toBeNull();
		expect(authService.getCurrentUser()).toBeNull();
		expect(listener).toHaveBeenCalledTimes(1);
		unsubscribe();
	});

	it('onSessionExpired devuelve la función para desuscribirse', () => {
		const listener = vi.fn();
		authService.onSessionExpired(listener)();

		authService.expireSession();

		expect(listener).not.toHaveBeenCalled();
	});
});
