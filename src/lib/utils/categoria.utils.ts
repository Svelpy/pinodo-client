import type {
	CategoriaArbolNodo,
	CategoriaItem,
	CategoriaOption,
	SeccionArbol
} from '#lib/interfaces/index.ts';

type CategoriaNode = Pick<CategoriaItem, 'id' | 'nombre' | 'parent_id'>;

/** Todas las categorías del árbol en una lista plana (padres antes que sus hijos) */
export function flattenCategoriaArbol(arbol: readonly SeccionArbol[]): CategoriaItem[] {
	const items: CategoriaItem[] = [];
	const visit = (nodos: readonly CategoriaArbolNodo[]) => {
		for (const nodo of nodos) {
			items.push(nodo.data);
			visit(nodo.children);
		}
	};
	for (const { categorias } of arbol) visit(categorias.data);
	return items;
}

/** Ids de todas las subcategorías (hijos, nietos…) de una categoría. No incluye la propia */
export function getDescendantIds(categorias: readonly CategoriaNode[], id: string): Set<string> {
	const descendants = new Set<string>();
	const pending = [id];

	while (pending.length > 0) {
		const current = pending.pop();
		for (const categoria of categorias) {
			if (categoria.parent_id === current && !descendants.has(categoria.id)) {
				descendants.add(categoria.id);
				pending.push(categoria.id);
			}
		}
	}
	return descendants;
}

/**
 * Nombre de una categoría con sus ancestros, de la raíz hacia abajo (p. ej. "Ropa › Bombers").
 * Si el id no existe devuelve ''. Corta si los datos tuvieran un ciclo.
 */
export function getCategoriaPath(
	categorias: readonly CategoriaNode[],
	id: string,
	separator = ' › '
): string {
	const byId = new Map(categorias.map((categoria) => [categoria.id, categoria]));
	const visited = new Set<string>();
	const names: string[] = [];

	let current = byId.get(id);
	while (current && !visited.has(current.id)) {
		visited.add(current.id);
		names.unshift(current.nombre);
		current = current.parent_id ? byId.get(current.parent_id) : undefined;
	}
	return names.join(separator);
}

/**
 * Categorías de una sección como opciones de select (con su ruta completa), ordenadas
 * alfabéticamente. Con `onlyLeaf` solo las que no tienen subcategorías: a esas se asignan los
 * productos. Una sección vacía no tiene opciones.
 */
export function getCategoriaOptions(
	categorias: readonly CategoriaItem[],
	seccionId: string,
	{ onlyLeaf = false }: { onlyLeaf?: boolean } = {}
): CategoriaOption[] {
	if (!seccionId) return [];
	const parentIds = new Set(categorias.map((categoria) => categoria.parent_id));
	return categorias
		.filter(
			(categoria) =>
				categoria.seccion_id === seccionId && (!onlyLeaf || !parentIds.has(categoria.id))
		)
		.map((categoria) => ({ id: categoria.id, label: getCategoriaPath(categorias, categoria.id) }))
		.sort((a, b) => a.label.localeCompare(b.label, 'es'));
}
