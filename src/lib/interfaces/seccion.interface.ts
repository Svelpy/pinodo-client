/** Sección del catálogo (p. ej. "Mujer"): agrupa categorías y productos */
export interface Seccion {
	id: string;
	nombre: string;
	/** Se genera en la API a partir del nombre y es único */
	slug: string;
	is_visible: boolean;
	created_at: string;
	updated_at: string;
}

/** `POST /secciones/` */
export interface CreateSeccionRequest {
	nombre: string;
	is_visible: boolean;
}

/** `PATCH /secciones/{id}`: solo se envían los campos modificados. Si cambia el nombre, el slug se regenera */
export type UpdateSeccionRequest = Partial<CreateSeccionRequest>;

/** `GET /secciones/`: sin paginación, devuelve todas las secciones */
export interface ListSeccionesParams {
	/** Solo las secciones visibles u ocultas; sin valor, todas */
	is_visible?: boolean;
}
