/** Datos que el usuario puede editar de su propio perfil (el rol no se modifica) */
export interface PerfilDatos {
	nombre: string;
	apellidos: string | null;
	telefono: string | null;
	email: string;
}

/** PATCH: solo se envían los campos modificados */
export type UpdatePerfilRequest = Partial<PerfilDatos>;

export interface ChangePerfilPasswordRequest {
	current_password: string;
	new_password: string;
}
