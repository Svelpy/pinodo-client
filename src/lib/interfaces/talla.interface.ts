/** Talla del catálogo (p. ej. "M" o "6-7 años"), asignable a los SKUs de los productos */
export interface Talla {
	id: string;
	/** Única sin distinguir mayúsculas */
	etiqueta: string;
	created_at: string;
	updated_at: string;
}

/** `POST /tallas/` */
export interface CreateTallaRequest {
	etiqueta: string;
}

/** `PATCH /tallas/{id}`: solo se envían los campos modificados */
export type UpdateTallaRequest = Partial<CreateTallaRequest>;
