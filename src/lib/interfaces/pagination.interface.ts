/** Parámetros de paginación que aceptan los listados de la API */
export interface PaginationParams {
	/** Mínimo 1. Por defecto 1 */
	page?: number;
	/** Entre 1 y 100. Por defecto 20 */
	per_page?: number;
}

/** Respuesta paginada estándar de la API */
export interface PaginatedResponse<T> {
	total: number;
	page: number;
	per_page: number;
	total_pages: number;
	data: T[];
}
