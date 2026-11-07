import type { AssignableUserRole, Role } from '#lib/config/permissions.config.ts';
import type { CurrentUser } from './auth.interface';
import type { PaginationParams } from './pagination.interface';

/** Usuario del panel: misma respuesta que `GET /usuarios/me`, vista desde el listado de Usuarios */
export type Usuario = CurrentUser;

/** `POST /usuarios/`: solo se pueden crear usuarios con un rol inferior al propio */
export interface CreateUsuarioRequest {
	email: string;
	password: string;
	nombre: string;
	apellidos: string | null;
	telefono: string | null;
	rol: AssignableUserRole;
}

/** `PATCH /usuarios/{id}`: solo se envían los campos modificados. La contraseña tiene su propio endpoint */
export type UpdateUsuarioRequest = Partial<Omit<CreateUsuarioRequest, 'password'>>;

/** `PATCH /usuarios/{id}/password` */
export interface ResetUsuarioPasswordRequest {
	new_password: string;
}

export interface ListUsuariosParams extends PaginationParams {
	/** Solo los usuarios de ese rol */
	rol?: Role;
}
