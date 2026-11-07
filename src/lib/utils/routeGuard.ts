import { redirect, type LoadEvent } from '@sveltejs/kit';
import { resolve } from '$app/paths';
import type { Role } from '#lib/config/permissions.config.ts';
import { authStore } from '#lib/stores/index.ts';
import { canAccessRoute, getHomeRoute, isRole } from './rbac.utils';
import { buildSignInUrl } from './signInUrl';

type GuardEvent = Pick<LoadEvent, 'route' | 'url' | 'untrack'>;

/**
 * Protege un área desde el `load` de su `+layout.ts`. Corre antes de renderizar, así nunca se ve
 * contenido no permitido. Lee `route.id`, por lo que SvelteKit vuelve a ejecutar el load en cada
 * navegación entre páginas del área.
 *
 * - Sin sesión: al login, recordando la página pedida en `?redirectTo=`.
 * - Con sesión pero sin acceso a la página: a la página de inicio de su rol.
 *
 * Solo protege la UI: si se agregan `+page.server.ts`, `+server.ts` o form actions,
 * necesitan su propia validación en el servidor.
 */
export async function guardRoute({ route, url, untrack }: GuardEvent): Promise<Role> {
	const session = await authStore.ensureSession();
	if (!session) {
		// untrack: cambiar solo los query params (?page=2) no debe volver a ejecutar el guard
		const redirectTo = untrack(() => url.pathname + url.search);
		redirect(307, buildSignInUrl('required', redirectTo));
	}

	const role = session.rol;
	if (!isRole(role)) {
		// Rol que el frontend no conoce: se deniega todo
		authStore.logout();
		redirect(307, resolve('/auth/sign-in'));
	}

	if (!canAccessRoute(role, route.id)) redirect(307, resolve(getHomeRoute(role)));

	return role;
}
