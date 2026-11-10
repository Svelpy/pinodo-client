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
	// Todas las acciones para SUPERADMIN, OWNER y ADMIN (fullAccess); el CAJERO no tiene acceso
	SECCION: 'SECCION',
	TALLA: 'TALLA',
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
const SOLO_LECTURA: readonly Action[] = [Action.READ];

/** Todas las acciones en todos los módulos, salvo las `overrides` indicadas */
function fullAccess(overrides: ModulePermissions = {}): ModulePermissions {
	const permissions: ModulePermissions = {};
	for (const module of Object.values(Module)) permissions[module] = ALL_ACTIONS;
	return { ...permissions, ...overrides };
}

/**
 * Un módulo ausente en un rol = sin acceso a ese módulo (ni siquiera lectura).
 * `Record<Role, ...>` obliga a configurar aquí cualquier rol nuevo.
 */
export const ROLE_PERMISSIONS: Record<Role, ModulePermissions> = {
	// Abre la página de venta pero el backend no le permite crear ventas
	[Role.SUPERADMIN]: fullAccess({
		[Module.VENTA]: SOLO_LECTURA,
		[Module.NEGOCIO]: SOLO_LECTURA
	}),
	// OWNER y ADMIN editan los datos del negocio (no lo crean ni eliminan: es una sola fila)
	[Role.OWNER]: fullAccess({ [Module.NEGOCIO]: [Action.READ, Action.UPDATE] }),
	[Role.ADMIN]: fullAccess({ [Module.NEGOCIO]: [Action.READ, Action.UPDATE] }),
	[Role.CAJERO]: {
		[Module.VENTA]: [Action.CREATE, Action.READ],
		// Lectura de lo que necesita para vender
		[Module.CATEGORIA]: SOLO_LECTURA,
		[Module.PRODUCTO]: SOLO_LECTURA,
		[Module.COLOR]: SOLO_LECTURA,
		[Module.NEGOCIO]: SOLO_LECTURA
	}
};
