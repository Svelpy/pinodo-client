import { resolve } from '$app/paths';
import type { ResolvedPathname, RouteId, RouteParams } from '$app/types';
import { Role } from './permissions.config';

/** Rutas sin parámetros (`[id]`): se pueden resolver a una URL sin datos extra */
export type StaticRouteId = {
	[K in RouteId]: RouteParams<K> extends Record<string, never> ? K : never;
}[RouteId];

/**
 * `resolve()` de una ruta sin parámetros guardada en una variable (`StaticRouteId`). Con más de 25
 * rutas estáticas TypeScript ya no puede comprobar `resolve(route)` contra la unión de tuplas de sus
 * argumentos (límite de combinaciones), aunque cada ruta sea válida; aquí se comprueba una sola vez.
 */
export function resolveRoute(route: StaticRouteId): ResolvedPathname {
	return (resolve as (route: StaticRouteId) => ResolvedPathname)(route);
}

/**
 * Páginas que puede abrir cada rol. Es independiente de los permisos por módulo:
 * leer un módulo (p. ej. NEGOCIO para mostrar el negocio en el header) no implica ver su página.
 */
export interface RoleAccess {
	/** Página de inicio del rol: destino tras el login y al entrar a una ruta no permitida */
	home: StaticRouteId;
	/** Cada ruta habilita también todas sus subrutas ('/app' cubre '/app/vales/[id]') */
	routes: readonly RouteId[];
	/**
	 * Solo esa página, sin sus subrutas. Para abrir una página raíz (p. ej. el inicio '/panel')
	 * sin habilitar todo lo que cuelga de ella.
	 */
	exactRoutes?: readonly RouteId[];
	/**
	 * Se deniegan aunque `routes` las cubra (también sus subrutas). Para quitar una página puntual
	 * a un rol que abre todo un área (p. ej. Mi negocio a SUPERADMIN, que abre todo '/panel').
	 */
	excludedRoutes?: readonly RouteId[];
}

/** `Record<Role, ...>` obliga a configurar aquí cualquier rol nuevo. Lo no listado se deniega. */
export const ROLE_ACCESS: Record<Role, RoleAccess> = {
	[Role.SUPERADMIN]: {
		home: '/panel',
		routes: ['/panel'],
		// No tiene negocio que configurar
		excludedRoutes: ['/panel/mi-negocio']
	},
	[Role.OWNER]: { home: '/panel', routes: ['/panel'] },
	// OWNER y ADMIN editan los datos del negocio
	[Role.ADMIN]: { home: '/panel', routes: ['/panel'] },
	[Role.CAJERO]: {
		home: '/panel/ventas',
		// '/panel/ventas' incluye el historial, el detalle y la edición de pedidos.
		// Sin kardex ni finanzas: el backend no le da MOVIMIENTO_INVENTARIO ni FINANZAS (no ve costos)
		routes: ['/panel/ventas', '/panel/perfil']
	}
};
