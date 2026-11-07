import type { Role } from '#lib/config/permissions.config.ts';

export interface LoginCredentials {
	/** Cédula de identidad */
	username: string;
	password: string;
}

export interface AuthActionResponse {
	status: string;
	message: string;
}

export interface RegisterRequest {
	nombre: string;
	apellidos: string | null;
	ci: string;
	telefono: string;
	genero: UserGenero;
	email: string | null;
	/** Formato YYYY-MM-DD */
	birth_date: string | null;
	direccion: string | null;
}

export type RegisterResponse = RegisterRequest;

export interface ForgotPasswordRequest {
	email: string;
}

export interface ResetPasswordRequest {
	password: string;
}

export interface LoginResponse {
	access_token: string;
	csrf_token: string;
	token_type: 'bearer';
}

export interface AuthTokens {
	accessToken: string;
	/** El refresh_token real viaja en una cookie HttpOnly; aquí se guarda el csrf_token asociado */
	csrfToken: string;
}

/**
 * Rol tal como llega de la API. Admite roles que el frontend aún no conoce:
 * validar con `isRole()` antes de usarlo para permisos (lo desconocido se deniega).
 */
export type UserRole = Role | (string & {});
export type UserGenero = 'M' | 'F' | 'O' | (string & {});

/** Usuario de la sesión: respuesta de `GET /usuarios/me` */
export interface CurrentUser {
	id: string;
	email: string;
	nombre: string;
	apellidos: string | null;
	telefono: string | null;
	rol: UserRole;
	created_at: string;
	updated_at: string | null;
}
