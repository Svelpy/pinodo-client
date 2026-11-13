import { describe, it, expect } from 'vitest';
import { Action, Module, Role } from '#lib/config/permissions.config.ts';
import type { NavSection } from '#lib/interfaces/index.ts';
import { filterNavigation } from './navigation';
import {
	can,
	canAccessRoute,
	canManageUserRole,
	canViewResumenAdmin,
	canViewResumenCajero,
	getAssignableUserRoles,
	getHomeRoute,
	getListableUserRoles,
	isRole,
	isSafeRedirect
} from './rbac.utils';

const PANEL_ROUTES = [
	'/panel',
	'/panel/ventas',
	'/panel/ventas/historial',
	'/panel/productos/categorias',
	'/panel/productos',
	'/panel/productos/colores',
	'/panel/productos/tallas',
	'/panel/archivos',
	'/panel/secciones',
	'/panel/usuarios',
	'/panel/mi-negocio',
	'/panel/finanzas',
	'/panel/perfil'
];

/** Rutas del panel que cada rol NO puede abrir */
const DENIED_ROUTES: Record<Role, string[]> = {
	[Role.SUPERADMIN]: ['/panel/mi-negocio'],
	[Role.OWNER]: [],
	[Role.ADMIN]: [],
	[Role.CAJERO]: [
		'/panel',
		'/panel/productos/categorias',
		'/panel/productos',
		'/panel/productos/colores',
		'/panel/productos/tallas',
		'/panel/archivos',
		'/panel/secciones',
		'/panel/usuarios',
		'/panel/mi-negocio',
		'/panel/finanzas'
	]
};

describe('isRole', () => {
	it('acepta solo roles conocidos', () => {
		expect(isRole('CAJERO')).toBe(true);
		expect(isRole('ROOT')).toBe(false);
		expect(isRole('CLIENTE')).toBe(false);
		expect(isRole('SOCIO')).toBe(false);
		expect(isRole(undefined)).toBe(false);
	});
});

describe('canAccessRoute', () => {
	it.each(Object.values(Role))('la página de inicio de %s es accesible para ese rol', (role) => {
		expect(canAccessRoute(role, getHomeRoute(role))).toBe(true);
	});

	it('el CAJERO inicia en la venta; los demás en el inicio del panel', () => {
		expect(getHomeRoute(Role.CAJERO)).toBe('/panel/ventas');
		for (const role of [Role.SUPERADMIN, Role.OWNER, Role.ADMIN]) {
			expect(getHomeRoute(role)).toBe('/panel');
		}
	});

	it.each(Object.values(Role))(
		'%s accede solo a las páginas del panel que le corresponden',
		(role) => {
			for (const route of PANEL_ROUTES) {
				expect(canAccessRoute(role, route)).toBe(!DENIED_ROUTES[role].includes(route));
			}
		}
	);

	it.each(Object.values(Role))('%s no accede a /app', (role) => {
		expect(canAccessRoute(role, '/app')).toBe(false);
	});

	it('solo SUPERADMIN, OWNER y ADMIN abren Finanzas', () => {
		for (const role of [Role.SUPERADMIN, Role.OWNER, Role.ADMIN]) {
			expect(canAccessRoute(role, '/panel/finanzas')).toBe(true);
		}
		expect(canAccessRoute(Role.CAJERO, '/panel/finanzas')).toBe(false);
	});

	it('solo OWNER y ADMIN abren Mi negocio', () => {
		expect(canAccessRoute(Role.OWNER, '/panel/mi-negocio')).toBe(true);
		expect(canAccessRoute(Role.ADMIN, '/panel/mi-negocio')).toBe(true);
		for (const role of [Role.SUPERADMIN, Role.CAJERO]) {
			expect(canAccessRoute(role, '/panel/mi-negocio')).toBe(false);
		}
	});

	it.each(Object.values(Role))('%s abre su perfil', (role) => {
		expect(canAccessRoute(role, '/panel/perfil')).toBe(true);
	});

	it('SUPERADMIN abre la venta aunque no pueda crearla', () => {
		expect(canAccessRoute(Role.SUPERADMIN, '/panel/ventas')).toBe(true);
		expect(canAccessRoute(Role.SUPERADMIN, '/panel/ventas/historial')).toBe(true);
	});

	it('una ruta excluida deniega también sus subrutas', () => {
		expect(canAccessRoute(Role.SUPERADMIN, '/panel/mi-negocio/[id]')).toBe(false);
		expect(canAccessRoute(Role.SUPERADMIN, '/(staff)/panel/mi-negocio')).toBe(false);
		expect(canAccessRoute(Role.SUPERADMIN, '/panel/mi-negocios')).toBe(true);
	});

	it('compara por segmentos, no por prefijo de texto', () => {
		expect(canAccessRoute(Role.CAJERO, '/panel/ventas/historial/[id]/editar')).toBe(true);
		expect(canAccessRoute(Role.CAJERO, '/panel/venta-rapida')).toBe(false);
		expect(canAccessRoute(Role.OWNER, '/application')).toBe(false);
	});

	it('ignora los grupos de rutas', () => {
		expect(canAccessRoute(Role.CAJERO, '/(staff)/panel/ventas')).toBe(true);
		expect(canAccessRoute(Role.CAJERO, '/(staff)/panel/usuarios')).toBe(false);
	});

	it('deniega sin rol o sin ruta', () => {
		expect(canAccessRoute(null, '/panel')).toBe(false);
		expect(canAccessRoute(Role.ADMIN, null)).toBe(false);
	});
});

describe('can', () => {
	// Módulos que no son ventas, el negocio (una sola fila: nadie lo crea ni elimina), el kardex
	// (no se edita ni se elimina) ni finanzas (solo reportes)
	const GESTION = Object.values(Module).filter(
		(module) =>
			module !== Module.VENTA &&
			module !== Module.NEGOCIO &&
			module !== Module.MOVIMIENTO_INVENTARIO &&
			module !== Module.FINANZAS
	);

	it.each([Role.SUPERADMIN, Role.OWNER])('%s tiene todas las acciones fuera de ventas', (role) => {
		for (const module of GESTION) {
			for (const action of Object.values(Action)) {
				expect(can(role, module, action)).toBe(true);
			}
		}
	});

	it('ADMIN crea, lee y actualiza fuera de ventas, pero no elimina', () => {
		for (const module of [...GESTION, Module.NEGOCIO]) {
			expect(can(Role.ADMIN, module, Action.READ)).toBe(true);
			expect(can(Role.ADMIN, module, Action.UPDATE)).toBe(true);
			expect(can(Role.ADMIN, module, Action.DELETE)).toBe(false);
		}
		for (const module of GESTION) {
			expect(can(Role.ADMIN, module, Action.CREATE)).toBe(true);
		}
	});

	it('kardex: SUPERADMIN todo; OWNER y ADMIN leen y registran ajustes; el CAJERO no lo ve', () => {
		for (const action of Object.values(Action)) {
			expect(can(Role.SUPERADMIN, Module.MOVIMIENTO_INVENTARIO, action)).toBe(true);
			expect(can(Role.CAJERO, Module.MOVIMIENTO_INVENTARIO, action)).toBe(false);
		}
		for (const role of [Role.OWNER, Role.ADMIN]) {
			expect(can(role, Module.MOVIMIENTO_INVENTARIO, Action.READ)).toBe(true);
			expect(can(role, Module.MOVIMIENTO_INVENTARIO, Action.CREATE)).toBe(true);
			expect(can(role, Module.MOVIMIENTO_INVENTARIO, Action.UPDATE)).toBe(false);
			expect(can(role, Module.MOVIMIENTO_INVENTARIO, Action.DELETE)).toBe(false);
		}
	});

	it('finanzas: SUPERADMIN, OWNER y ADMIN solo leen los reportes; el CAJERO no los ve', () => {
		for (const role of [Role.SUPERADMIN, Role.OWNER, Role.ADMIN]) {
			expect(can(role, Module.FINANZAS, Action.READ)).toBe(true);
			for (const action of [Action.CREATE, Action.UPDATE, Action.DELETE]) {
				expect(can(role, Module.FINANZAS, action)).toBe(false);
			}
		}
		for (const action of Object.values(Action)) {
			expect(can(Role.CAJERO, Module.FINANZAS, action)).toBe(false);
		}
	});

	it('ventas: OWNER y ADMIN todo; el CAJERO no anula cobradas (DELETE); SUPERADMIN solo lee', () => {
		for (const role of [Role.OWNER, Role.ADMIN]) {
			for (const action of Object.values(Action)) {
				expect(can(role, Module.VENTA, action)).toBe(true);
			}
		}
		expect(can(Role.CAJERO, Module.VENTA, Action.CREATE)).toBe(true);
		expect(can(Role.CAJERO, Module.VENTA, Action.READ)).toBe(true);
		expect(can(Role.CAJERO, Module.VENTA, Action.UPDATE)).toBe(true);
		expect(can(Role.CAJERO, Module.VENTA, Action.DELETE)).toBe(false);
		expect(can(Role.SUPERADMIN, Module.VENTA, Action.READ)).toBe(true);
		for (const action of [Action.CREATE, Action.UPDATE, Action.DELETE]) {
			expect(can(Role.SUPERADMIN, Module.VENTA, action)).toBe(false);
		}
	});

	it('CAJERO solo lee categorías, productos, colores y negocio', () => {
		for (const module of [Module.CATEGORIA, Module.PRODUCTO, Module.COLOR, Module.NEGOCIO]) {
			expect(can(Role.CAJERO, module, Action.READ)).toBe(true);
			expect(can(Role.CAJERO, module, Action.CREATE)).toBe(false);
			expect(can(Role.CAJERO, module, Action.UPDATE)).toBe(false);
			expect(can(Role.CAJERO, module, Action.DELETE)).toBe(false);
		}
	});

	it.each([Module.SECCION, Module.TALLA, Module.ARCHIVO, Module.USUARIO])(
		'CAJERO no tiene ninguna acción en %s',
		(module) => {
			for (const action of Object.values(Action)) {
				expect(can(Role.CAJERO, module, action)).toBe(false);
			}
		}
	);

	it.each([Role.OWNER, Role.ADMIN])('%s lee y edita el negocio, pero no lo elimina', (role) => {
		expect(can(role, Module.NEGOCIO, Action.READ)).toBe(true);
		expect(can(role, Module.NEGOCIO, Action.UPDATE)).toBe(true);
		expect(can(role, Module.NEGOCIO, Action.DELETE)).toBe(false);
	});

	it('SUPERADMIN y CAJERO solo leen el negocio', () => {
		for (const role of [Role.SUPERADMIN, Role.CAJERO]) {
			expect(can(role, Module.NEGOCIO, Action.READ)).toBe(true);
			expect(can(role, Module.NEGOCIO, Action.UPDATE)).toBe(false);
		}
	});

	it('deniega sin rol', () => {
		expect(can(null, Module.CATEGORIA, Action.READ)).toBe(false);
	});
});

describe('isSafeRedirect', () => {
	it('acepta solo rutas internas', () => {
		expect(isSafeRedirect('/panel/ventas?page=2')).toBe(true);
		expect(isSafeRedirect('//evil.com')).toBe(false);
		expect(isSafeRedirect('/\\evil.com')).toBe(false);
		expect(isSafeRedirect('https://evil.com')).toBe(false);
		expect(isSafeRedirect(null)).toBe(false);
	});
});

describe('filterNavigation', () => {
	const icon = (() => {}) as unknown as NavSection['items'][number]['icon'];
	const sections: NavSection[] = [
		{
			id: 'general',
			label: 'General',
			items: [{ id: 'inicio', label: 'Inicio', route: '/panel', href: '/panel', icon }]
		},
		{
			id: 'ventas',
			label: 'Ventas',
			items: [
				{ id: 'venta', label: 'Nueva venta', route: '/panel/ventas', href: '/panel/ventas', icon },
				{
					id: 'historial-ventas',
					label: 'Historial de ventas',
					route: '/panel/ventas/historial',
					href: '/panel/ventas/historial',
					icon
				}
			]
		},
		{
			id: 'administracion',
			label: 'Administración',
			items: [
				{
					id: 'mi-negocio',
					label: 'Mi negocio',
					route: '/panel/mi-negocio',
					href: '/panel/mi-negocio',
					icon
				}
			]
		}
	];

	it('deja solo los items permitidos y quita las secciones vacías', () => {
		const result = filterNavigation(sections, Role.CAJERO);
		expect(result.map((section) => section.id)).toEqual(['ventas']);
		expect(result[0].items.map((item) => item.id)).toEqual(['venta', 'historial-ventas']);
	});

	it('Mi negocio solo aparece para OWNER y ADMIN', () => {
		const ids = (role: Role) =>
			filterNavigation(sections, role).flatMap((section) => section.items.map((item) => item.id));
		expect(ids(Role.OWNER)).toContain('mi-negocio');
		expect(ids(Role.ADMIN)).toContain('mi-negocio');
		expect(ids(Role.CAJERO)).not.toContain('mi-negocio');
		expect(ids(Role.SUPERADMIN)).not.toContain('mi-negocio');
	});

	it('sin rol no muestra nada', () => {
		expect(filterNavigation(sections, null)).toEqual([]);
	});

	describe('con hijos', () => {
		const withChildren: NavSection[] = [
			{
				id: 'catalogo',
				label: 'Catálogo',
				items: [
					{
						id: 'productos',
						label: 'Productos',
						route: '/panel/productos',
						href: '/panel/productos',
						icon,
						children: [
							{
								id: 'categorias',
								label: 'Categorías',
								route: '/panel/productos/categorias',
								href: '/panel/productos/categorias'
							}
						]
					},
					{
						id: 'venta',
						label: 'Ventas',
						route: '/panel/ventas',
						href: '/panel/ventas',
						icon,
						children: [
							{
								id: 'historial-ventas',
								label: 'Historial',
								route: '/panel/ventas/historial',
								href: '/panel/ventas/historial'
							},
							{
								id: 'categorias',
								label: 'Categorías',
								route: '/panel/productos/categorias',
								href: '/panel/productos/categorias'
							}
						]
					}
				]
			}
		];

		it('quita al padre que el rol no abre y los hijos que no puede abrir', () => {
			const [{ items }] = filterNavigation(withChildren, Role.CAJERO);
			// Productos no está permitido para CAJERO: se va con sus hijos
			expect(items.map((item) => item.id)).toEqual(['venta']);
			// De Ventas solo queda el hijo permitido
			expect(items[0].children?.map((child) => child.id)).toEqual(['historial-ventas']);
		});
	});
});

describe('getListableUserRoles', () => {
	it('cada rol ve su mismo nivel y los inferiores', () => {
		expect(getListableUserRoles(Role.SUPERADMIN)).toEqual([
			Role.SUPERADMIN,
			Role.OWNER,
			Role.ADMIN,
			Role.CAJERO
		]);
		expect(getListableUserRoles(Role.OWNER)).toEqual([Role.OWNER, Role.ADMIN, Role.CAJERO]);
		expect(getListableUserRoles(Role.ADMIN)).toEqual([Role.ADMIN, Role.CAJERO]);
		expect(getListableUserRoles(Role.CAJERO)).toEqual([]);
		expect(getListableUserRoles(null)).toEqual([]);
	});
});

describe('canManageUserRole', () => {
	it('solo gestiona roles inferiores, nunca el mismo', () => {
		expect(canManageUserRole(Role.SUPERADMIN, Role.OWNER)).toBe(true);
		expect(canManageUserRole(Role.SUPERADMIN, Role.SUPERADMIN)).toBe(false);
		expect(canManageUserRole(Role.OWNER, Role.ADMIN)).toBe(true);
		expect(canManageUserRole(Role.OWNER, Role.OWNER)).toBe(false);
		expect(canManageUserRole(Role.OWNER, Role.SUPERADMIN)).toBe(false);
		expect(canManageUserRole(Role.ADMIN, Role.CAJERO)).toBe(true);
		expect(canManageUserRole(Role.ADMIN, Role.ADMIN)).toBe(false);
		expect(canManageUserRole(Role.CAJERO, Role.CAJERO)).toBe(false);
	});

	it('deniega sin rol o con un rol desconocido', () => {
		expect(canManageUserRole(null, Role.CAJERO)).toBe(false);
		expect(canManageUserRole(Role.SUPERADMIN, 'ROOT')).toBe(false);
		expect(canManageUserRole(Role.SUPERADMIN, 'CLIENTE')).toBe(false);
	});
});

describe('getAssignableUserRoles', () => {
	it('solo asigna roles inferiores que la API acepta', () => {
		expect(getAssignableUserRoles(Role.SUPERADMIN)).toEqual([Role.OWNER, Role.ADMIN, Role.CAJERO]);
		expect(getAssignableUserRoles(Role.OWNER)).toEqual([Role.ADMIN, Role.CAJERO]);
		expect(getAssignableUserRoles(Role.ADMIN)).toEqual([Role.CAJERO]);
		expect(getAssignableUserRoles(Role.CAJERO)).toEqual([]);
	});
});

describe('canViewResumenAdmin', () => {
	it('solo OWNER y ADMIN', () => {
		expect(canViewResumenAdmin(Role.OWNER)).toBe(true);
		expect(canViewResumenAdmin(Role.ADMIN)).toBe(true);
	});

	it('SUPERADMIN y CAJERO no lo ven', () => {
		for (const role of [Role.SUPERADMIN, Role.CAJERO]) {
			expect(canViewResumenAdmin(role)).toBe(false);
		}
		expect(canViewResumenAdmin(null)).toBe(false);
	});
});

describe('canViewResumenCajero', () => {
	it('solo CAJERO', () => {
		expect(canViewResumenCajero(Role.CAJERO)).toBe(true);
		for (const role of [Role.SUPERADMIN, Role.OWNER, Role.ADMIN]) {
			expect(canViewResumenCajero(role)).toBe(false);
		}
		expect(canViewResumenCajero(null)).toBe(false);
	});
});
