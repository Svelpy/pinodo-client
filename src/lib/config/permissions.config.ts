/**
 * Permisos por rol sobre cada módulo: quién puede hacer qué, sobre qué módulo.
 * Espejo de `shared/services/permissions.py` del backend; si cambia allá, cambia aquí.
 *
 * Solo decide qué se muestra en la UI (botones, opciones). La seguridad real la aplica
 * el backend con `has_permission` en cada endpoint.
 * El acceso a páginas se configura aparte en `routeAccess.config.ts`.
 */

export const Role = {
	SUPERADMIN: 'SUPERADMIN',
	OWNER: 'OWNER',
	ADMIN: 'ADMIN',
	CAJERO: 'CAJERO'
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const Module = {
	USUARIO: 'USUARIO',
	VENTA: 'VENTA',
	CATEGORIA: 'CATEGORIA',
	PRODUCTO: 'PRODUCTO',
	COLOR: 'COLOR',
	// El CAJERO no tiene acceso a estos tres
	SECCION: 'SECCION',
	TALLA: 'TALLA',
	// Biblioteca de imágenes (`IMAGEN` en el backend)
	ARCHIVO: 'ARCHIVO',
	NEGOCIO: 'NEGOCIO'
} as const;
export type Module = (typeof Module)[keyof typeof Module];

export const Action = {
	CREATE: 'CREATE',
	READ: 'READ',
	UPDATE: 'UPDATE',
	DELETE: 'DELETE'
} as const;
export type Action = (typeof Action)[keyof typeof Action];

/** Roles de los usuarios del panel: hoy son todos los roles */
export type PanelUserRole = Role;

/**
 * Nivel jerárquico para gestionar usuarios del panel: un rol solo crea, edita, restablece la
 * contraseña o elimina a usuarios de un nivel inferior al suyo (nunca del mismo nivel).
 */
export const ROLE_LEVEL: Record<Role, number> = {
	[Role.SUPERADMIN]: 4,
	[Role.OWNER]: 3,
	[Role.ADMIN]: 2,
	[Role.CAJERO]: 1
};

/** Roles que la API acepta al crear o editar un usuario del panel */
export const ASSIGNABLE_USER_ROLES = [Role.OWNER, Role.ADMIN, Role.CAJERO] as const;
export type AssignableUserRole = (typeof ASSIGNABLE_USER_ROLES)[number];

/**
 * Roles que cada rol ve en Usuarios, en el orden de las pestañas: su mismo nivel y los
 * inferiores. CAJERO no abre esa página.
 */
export const LISTABLE_USER_ROLES: Record<Role, readonly PanelUserRole[]> = {
	[Role.SUPERADMIN]: [Role.SUPERADMIN, Role.OWNER, Role.ADMIN, Role.CAJERO],
	[Role.OWNER]: [Role.OWNER, Role.ADMIN, Role.CAJERO],
	[Role.ADMIN]: [Role.ADMIN, Role.CAJERO],
	[Role.CAJERO]: []
};

/**
 * Roles que ven el resumen de inicio del panel (`/resumen/admin`). En el backend no es un módulo:
 * la ruta usa `require_role(Role.OWNER, Role.ADMIN)`, así que SUPERADMIN no tiene acceso.
 */
export const RESUMEN_ADMIN_ROLES: readonly Role[] = [Role.OWNER, Role.ADMIN];

/** Roles que ven el resumen de sus propias compras del día (`/resumen/cajero`, `require_role(CAJERO)`) */
export const RESUMEN_CAJERO_ROLES: readonly Role[] = [Role.CAJERO];

type ModulePermissions = Partial<Record<Module, readonly Action[]>>;

const ALL_ACTIONS: readonly Action[] = [Action.CREATE, Action.READ, Action.UPDATE, Action.DELETE];
const SIN_ELIMINAR: readonly Action[] = [Action.CREATE, Action.READ, Action.UPDATE];
const SOLO_LECTURA: readonly Action[] = [Action.READ];

/** Las mismas acciones en todos los módulos, salvo las `overrides` indicadas */
function everyModule(actions: readonly Action[], overrides: ModulePermissions): ModulePermissions {
	const permissions: ModulePermissions = {};
	for (const module of Object.values(Module)) permissions[module] = actions;
	return { ...permissions, ...overrides };
}

/** Todas las acciones en todos los módulos, salvo las `overrides` indicadas */
const fullAccess = (overrides: ModulePermissions = {}) => everyModule(ALL_ACTIONS, overrides);

/** Crear, leer y actualizar en todos los módulos, nunca eliminar, salvo las `overrides` indicadas */
const sinEliminar = (overrides: ModulePermissions = {}) => everyModule(SIN_ELIMINAR, overrides);

/**
 * Un módulo ausente en un rol = sin acceso a ese módulo (ni siquiera lectura).
 * `Record<Role, ...>` obliga a configurar aquí cualquier rol nuevo.
 *
 * Ventas: registrar es VENTA:CREATE; editar, cobrar y cancelar un pendiente, VENTA:UPDATE; anular
 * una venta ya cobrada (devuelve el stock), VENTA:DELETE.
 * El negocio es una sola fila: nadie lo crea ni lo elimina.
 */
export const ROLE_PERMISSIONS: Record<Role, ModulePermissions> = {
	// Todo salvo ventas: las consulta, pero no registra, edita, cobra, cancela ni anula
	[Role.SUPERADMIN]: fullAccess({
		[Module.VENTA]: SOLO_LECTURA,
		[Module.NEGOCIO]: SOLO_LECTURA
	}),
	// Todo, incluido eliminar y anular ventas cobradas
	[Role.OWNER]: fullAccess({ [Module.NEGOCIO]: [Action.READ, Action.UPDATE] }),
	// Todo menos eliminar, salvo en ventas: también anula ventas cobradas
	[Role.ADMIN]: sinEliminar({
		[Module.VENTA]: ALL_ACTIONS,
		[Module.NEGOCIO]: [Action.READ, Action.UPDATE]
	}),
	// Solo lectura de lo que necesita para vender; en ventas registra y gestiona los pendientes
	[Role.CAJERO]: {
		[Module.VENTA]: SIN_ELIMINAR,
		[Module.CATEGORIA]: SOLO_LECTURA,
		[Module.PRODUCTO]: SOLO_LECTURA,
		[Module.COLOR]: SOLO_LECTURA,
		[Module.NEGOCIO]: SOLO_LECTURA
	}
};
