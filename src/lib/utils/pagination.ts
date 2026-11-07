import { PAGINATION } from '#lib/constants/index.ts';
import type { PaginatedResponse, PaginationParams } from '#lib/interfaces/index.ts';

const clamp = (value: number, min: number, max: number): number =>
	Math.min(max, Math.max(min, Math.trunc(value)));

/**
 * Query de paginación dentro de los límites de la API (page ≥ 1, per_page 1–100).
 * Sin valores envía los por defecto (page=1, per_page=20).
 */
export function buildPaginationQuery({
	page = PAGINATION.DEFAULT_PAGE,
	per_page = PAGINATION.DEFAULT_PER_PAGE
}: PaginationParams = {}): URLSearchParams {
	return new URLSearchParams({
		page: String(Math.max(1, Math.trunc(page))),
		per_page: String(clamp(per_page, 1, PAGINATION.MAX_PER_PAGE))
	});
}

/**
 * Recorre todas las páginas de un listado (con el máximo por página) y devuelve los items juntos.
 * Útil para llenar selects de filtros con catálogos pequeños (categorías, negocios).
 */
export async function fetchAllPages<T>(
	fetchPage: (params: Required<PaginationParams>) => Promise<PaginatedResponse<T>>
): Promise<T[]> {
	const per_page = PAGINATION.MAX_PER_PAGE;
	const first = await fetchPage({ page: PAGINATION.DEFAULT_PAGE, per_page });
	if (first.total_pages <= 1) return first.data;

	const rest = await Promise.all(
		Array.from({ length: first.total_pages - 1 }, (_, i) => fetchPage({ page: i + 2, per_page }))
	);
	return [first, ...rest].flatMap((response) => response.data);
}
