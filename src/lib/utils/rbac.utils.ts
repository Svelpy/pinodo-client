import {
	ASSIGNABLE_USER_ROLES,
	LISTABLE_USER_ROLES,
	ROLE_LEVEL,
	RESUMEN_ADMIN_ROLES,
	RESUMEN_CAJERO_ROLES,
	ROLE_PERMISSIONS,
	Role,
	type Action,
	type AssignableUserRole,
	type Module,
	type PanelUserRole
} from '#lib/config/permissions.config.ts';
import type { RouteId } from '$app/types';
import { ROLE_ACCESS, type StaticRouteId } from '#lib/config/routeAccess.config.ts';

const ROLES = new Set<string>(Object.values(Role));

/** true si el valor (p. ej. el rol que devuelve la API) es un rol conocido por el frontend */
export function isRole(value: unknown): value is Role {
	return typeof value === 'string' && ROLES.has(value);
}

/** true si el rol tiene la acción habilitada en ese módulo (equivale a `has_permission` del backend) */
export function can(role: Role | null, module: Module, action: Action): boolean {
	if (!role) return false;
	return ROLE_PERMISSIONS[role]?.[module]?.includes(action) ?? false;
}

/** true si el rol puede consultar el resumen de inicio del panel */
export function canViewResumenAdmin(role: Role | null): boolean {
	return !!role && RESUMEN_ADMIN_ROLES.includes(role);
}

/** true si el rol puede consultar el resumen de sus compras del día */
export function canViewResumenCajero(role: Role | null): boolean {
	return !!role && RESUMEN_CAJERO_ROLES.includes(role);
}

/** Roles de usuarios del panel que el rol puede ver en Administradores */
export function getListableUserRoles(role: Role | null): readonly PanelUserRole[] {
	return role ? LISTABLE_USER_ROLES[role] : [];
}

/**
 * true si el rol puede editar, restablecer la contraseña o eliminar a un usuario con `targetRole`:
 * solo a niveles inferiores al suyo. Un rol desconocido se deniega.
 */
export function canManageUserRole(role: Role | null, targetRole: unknown): boolean {
	if (!role || !isRole(targetRole)) return false;
	return ROLE_LEVEL[targetRole] < ROLE_LEVEL[role];
}

/** Roles que el rol puede asignar al crear o editar un usuario del panel */
export function getAssignableUserRoles(role: Role | null): AssignableUserRole[] {
	return ASSIGNABLE_USER_ROLES.filter((target) => canManageUserRole(role, target));
}

// Los grupos de rutas `(grupo)` no forman parte de la URL: '/(admin)/panel' equivale a '/panel'
function stripRouteGroups(routeId: string): string {
	return routeId.replace(/\/\([^)]+\)/g, '') || '/';
}

/** true si el rol puede abrir la ruta (route id de SvelteKit, p. ej. '/app/vales/[id]') */
export function canAccessRoute(role: Role | null, routeId: string | null): boolean {
	if (!role || !routeId) return false;
	const access = ROLE_ACCESS[role];
	if (!access) return false;

	const id = stripRouteGroups(routeId);
	// Por segmentos: '/panel/canjes' cubre '/panel/canjes/[id]' pero no '/panel/canjes-x'
	const covers = (route: string) => id === route || id.startsWith(`${route}/`);

	if (access.excludedRoutes?.some(covers)) return false;
	if (access.exactRoutes?.includes(id as RouteId)) return true;
	return access.routes.some(covers);
}

/** Página de inicio del rol */
export function getHomeRoute(role: Role): StaticRouteId {
	return ROLE_ACCESS[role].home;
}

/** Solo rutas internas del sitio: evita redirecciones abiertas con `?redirectTo=//otro-sitio.com` */
export function isSafeRedirect(path: string | null): path is string {
	return !!path && path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\');
}
