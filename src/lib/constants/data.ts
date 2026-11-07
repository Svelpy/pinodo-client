import type { Role } from '#lib/config/permissions.config.ts';

export const NO_DATA_LABEL = '—';

/** Límites de paginación que acepta la API (`per_page`: 1–100) */
export const PAGINATION = {
	DEFAULT_PAGE: 1,
	DEFAULT_PER_PAGE: 20,
	MAX_PER_PAGE: 100,
	PER_PAGE_OPTIONS: [10, 20, 50, 100]
} as const;

/** Etiquetas de rol de usuario (valores que devuelve la API) */
export const ROLE_LABEL: Record<Role, string> = {
	SUPERADMIN: 'Superadministrador',
	OWNER: 'Propietario',
	ADMIN: 'Administrador',
	CAJERO: 'Cajero'
};

/** Etiquetas de rol en plural (p. ej. pestañas de Usuarios) */
export const ROLE_PLURAL_LABEL: Record<Role, string> = {
	SUPERADMIN: 'Superadministradores',
	OWNER: 'Propietarios',
	ADMIN: 'Administradores',
	CAJERO: 'Cajeros'
};

/** Etiquetas de género de usuario (valores que acepta la API) */
export const USER_GENERO_LABEL: Record<'M' | 'F' | 'O', string> = {
	M: 'Masculino',
	F: 'Femenino',
	O: 'Otro'
};

/** Páginas legales públicas: se enlazan desde la landing, el login, el registro y entre sí */
export const LEGAL_PAGES = [
	{ href: '/(legal)/terminos', label: 'Términos y condiciones' },
	{ href: '/(legal)/privacidad', label: 'Política de privacidad' },
	{ href: '/(legal)/cookies', label: 'Política de cookies' }
] as const;

/**
 * Tipos de imagen de un producto que acepta la API (`tipo`); por defecto `MODELO`.
 * Si la API suma más tipos, se agregan aquí y en `IMAGEN_TIPO_LABEL`: el formulario los ofrece solo.
 */
export const IMAGEN_TIPO = {
	MODELO: 'MODELO',
	PRENDA: 'PRENDA',
	DETALLE: 'DETALLE'
} as const;
export type ImagenTipo = (typeof IMAGEN_TIPO)[keyof typeof IMAGEN_TIPO];

/** Tipo que se asigna a una imagen nueva, el mismo que la API usa por defecto */
export const IMAGEN_TIPO_DEFAULT: ImagenTipo = IMAGEN_TIPO.MODELO;

/** Etiquetas de los tipos de imagen */
export const IMAGEN_TIPO_LABEL: Record<ImagenTipo, string> = {
	MODELO: 'Modelo',
	PRENDA: 'Prenda',
	DETALLE: 'Detalle'
};

/** Archivos de imagen de producto: la API no admite SVG ni archivos de más de 5 MB */
export const IMAGEN_LIMITS = {
	MAX_BYTES: 5 * 1024 * 1024
} as const;
