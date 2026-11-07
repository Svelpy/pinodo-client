import { resolve } from '$app/paths';
import { isSafeRedirect } from './rbac.utils';

/**
 * Motivo por el que se llega al login (se muestra como aviso):
 * - `expired`: había una sesión y el servidor la rechazó o desaparecieron sus tokens
 * - `required`: se pidió una página protegida sin sesión
 */
export type SignInReason = 'expired' | 'required';

export const SIGN_IN_REASON_PARAM = 'reason';

export const SIGN_IN_REASON_MESSAGES: Record<SignInReason, string> = {
	expired: 'Tu sesión expiró. Inicia sesión nuevamente.',
	required: 'Inicia sesión para continuar.'
};

export function isSignInReason(value: unknown): value is SignInReason {
	return value === 'expired' || value === 'required';
}

/**
 * URL del login con el motivo y, si es una ruta interna segura, la página a la que volver tras
 * iniciar sesión (`?redirectTo=`).
 */
export function buildSignInUrl(reason: SignInReason, redirectTo?: string | null): string {
	const params = new URLSearchParams();
	if (isSafeRedirect(redirectTo ?? null)) params.set('redirectTo', redirectTo as string);
	params.set(SIGN_IN_REASON_PARAM, reason);
	return `${resolve('/auth/sign-in')}?${params}`;
}
