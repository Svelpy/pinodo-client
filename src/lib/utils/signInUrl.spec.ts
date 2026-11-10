import { describe, expect, it } from 'vitest';
import { buildSignInUrl, isSignInReason } from './signInUrl';

describe('buildSignInUrl', () => {
	it('incluye el motivo y la página a la que volver', () => {
		const url = new URL(buildSignInUrl('expired', '/panel/usuarios?page=2'), 'http://localhost');
		expect(url.pathname).toBe('/auth/sign-in');
		expect(url.searchParams.get('reason')).toBe('expired');
		expect(url.searchParams.get('redirectTo')).toBe('/panel/usuarios?page=2');
	});

	it('sin redirectTo solo envía el motivo', () => {
		const url = new URL(buildSignInUrl('required'), 'http://localhost');
		expect(url.searchParams.get('reason')).toBe('required');
		expect(url.searchParams.has('redirectTo')).toBe(false);
	});

	it.each(['//evil.com', 'https://evil.com', '/\\evil.com', ''])(
		'descarta el redirectTo inseguro %j',
		(redirectTo) => {
			const url = new URL(buildSignInUrl('expired', redirectTo), 'http://localhost');
			expect(url.searchParams.has('redirectTo')).toBe(false);
		}
	);
});

describe('isSignInReason', () => {
	it('acepta solo motivos conocidos', () => {
		expect(isSignInReason('expired')).toBe(true);
		expect(isSignInReason('required')).toBe(true);
		expect(isSignInReason('password')).toBe(true);
		expect(isSignInReason('otro')).toBe(false);
		expect(isSignInReason(null)).toBe(false);
	});
});
