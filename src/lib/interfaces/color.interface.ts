/** Color del catálogo (p. ej. "Azul marino"), asignable a los productos */
export interface Color {
	id: string;
	nombre: string;
	/** Se genera en la API a partir del nombre (ignora mayúsculas, tildes, espacios y signos) */
	slug: string;
	/** Siempre con almohadilla, 6 dígitos (p. ej. "#1E3A8A") */
	codigo_hex: string;
	created_at: string;
	updated_at: string;
}

/** `POST /colores/`: el nombre debe ser único (se compara su slug) */
export interface CreateColorRequest {
	nombre: string;
	codigo_hex: string;
}

/** `PATCH /colores/{id}`: solo se envían los campos modificados. Si cambia el nombre, el slug se regenera */
export type UpdateColorRequest = Partial<CreateColorRequest>;
