import type { Role } from '#lib/config/permissions.config.ts';
import type { NavChildItem, NavItem, NavSection } from '#lib/interfaces/index.ts';
import { canAccessRoute } from './rbac.utils';

export function isNavItemActive(item: NavChildItem, pathname: string): boolean {
	if (item.exact) return pathname === item.href;
	return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

/**
 * Página activa para la ruta actual (padres e hijos); si varias coinciden, gana la ruta más
 * específica. Un hijo hereda el icono de su padre para poder mostrarlo en el título.
 */
export function findActiveNavItem(
	sections: NavSection[],
	pathname: string
): Omit<NavItem, 'children'> | undefined {
	return sections
		.flatMap((section) => section.items)
		.flatMap(({ children = [], ...item }) => [
			item,
			...children.map((child) => ({ ...child, icon: item.icon }))
		])
		.filter((item) => isNavItemActive(item, pathname))
		.sort((a, b) => b.href.length - a.href.length)[0];
}

/**
 * Menú con solo las páginas que el rol puede abrir; las secciones que quedan vacías se quitan.
 * El padre es una página más: si el rol no puede abrirla, se quita junto con sus hijos.
 */
export function filterNavigation(sections: NavSection[], role: Role | null): NavSection[] {
	return sections
		.map((section) => ({
			...section,
			items: section.items
				.filter((item) => canAccessRoute(role, item.route))
				.map((item) =>
					item.children
						? {
								...item,
								children: item.children.filter((child) => canAccessRoute(role, child.route))
							}
						: item
				)
		}))
		.filter((section) => section.items.length > 0);
}
