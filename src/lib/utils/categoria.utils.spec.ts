import { describe, expect, it } from 'vitest';
import type { CategoriaItem, SeccionArbol } from '#lib/interfaces/index.ts';
import {
	flattenCategoriaArbol,
	getCategoriaOptions,
	getCategoriaPath,
	getDescendantIds
} from './categoria.utils';

const categorias = [
	{ id: 'ropa', nombre: 'Ropa', parent_id: null },
	{ id: 'bombers', nombre: 'Bombers', parent_id: 'ropa' },
	{ id: 'acolchadas', nombre: 'Acolchadas', parent_id: 'bombers' },
	{ id: 'calzado', nombre: 'Calzado', parent_id: null }
];

describe('getDescendantIds', () => {
	it('incluye hijos y nietos, sin la propia categoría', () => {
		expect([...getDescendantIds(categorias, 'ropa')].sort()).toEqual(['acolchadas', 'bombers']);
	});

	it('una categoría sin subcategorías no tiene descendientes', () => {
		expect(getDescendantIds(categorias, 'calzado').size).toBe(0);
	});

	it('no se queda en bucle si los datos tienen un ciclo', () => {
		const cyclic = [
			{ id: 'a', nombre: 'A', parent_id: 'b' },
			{ id: 'b', nombre: 'B', parent_id: 'a' }
		];
		expect([...getDescendantIds(cyclic, 'a')].sort()).toEqual(['a', 'b']);
	});
});

describe('getCategoriaPath', () => {
	it('une los ancestros desde la raíz', () => {
		expect(getCategoriaPath(categorias, 'acolchadas')).toBe('Ropa › Bombers › Acolchadas');
	});

	it('una raíz es solo su nombre', () => {
		expect(getCategoriaPath(categorias, 'calzado')).toBe('Calzado');
	});

	it('un id desconocido da un texto vacío', () => {
		expect(getCategoriaPath(categorias, 'nope')).toBe('');
	});

	it('corta ante un ciclo', () => {
		const cyclic = [
			{ id: 'a', nombre: 'A', parent_id: 'b' },
			{ id: 'b', nombre: 'B', parent_id: 'a' }
		];
		expect(getCategoriaPath(cyclic, 'a')).toBe('B › A');
	});
});

describe('flattenCategoriaArbol', () => {
	const item = (id: string, parent_id: string | null) =>
		({ id, nombre: id, parent_id }) as unknown as CategoriaItem;
	const seccion = (categorias: SeccionArbol['categorias']) =>
		({ seccion: { id: 's' }, categorias }) as unknown as SeccionArbol;

	it('aplana todas las secciones y niveles, padres antes que hijos', () => {
		const arbol = [
			seccion({
				total: 3,
				data: [
					{
						data: item('ropa', null),
						children: [{ data: item('bombers', 'ropa'), children: [] }]
					},
					{ data: item('calzado', null), children: [] }
				]
			}),
			seccion({ total: 1, data: [{ data: item('otra', null), children: [] }] })
		];
		expect(flattenCategoriaArbol(arbol).map((c) => c.id)).toEqual([
			'ropa',
			'bombers',
			'calzado',
			'otra'
		]);
	});

	it('una sección sin categorías no aporta nada', () => {
		expect(flattenCategoriaArbol([seccion({ total: 0, data: [] })])).toEqual([]);
	});
});

describe('getCategoriaOptions', () => {
	const item = (id: string, nombre: string, parent_id: string | null, seccion_id = 's1') =>
		({ id, nombre, parent_id, seccion_id }) as unknown as CategoriaItem;
	const catalogo = [
		item('ropa', 'Ropa', null),
		item('bombers', 'Bombers', 'ropa'),
		item('calzado', 'Calzado', null),
		item('otra', 'Otra', null, 's2')
	];

	it('ofrece las categorías de la sección con su ruta, en orden alfabético', () => {
		expect(getCategoriaOptions(catalogo, 's1')).toEqual([
			{ id: 'calzado', label: 'Calzado' },
			{ id: 'ropa', label: 'Ropa' },
			{ id: 'bombers', label: 'Ropa › Bombers' }
		]);
	});

	it('con onlyLeaf deja solo las que no tienen subcategorías', () => {
		expect(getCategoriaOptions(catalogo, 's1', { onlyLeaf: true }).map((o) => o.id)).toEqual([
			'calzado',
			'bombers'
		]);
	});

	it('sin sección no hay opciones', () => {
		expect(getCategoriaOptions(catalogo, '')).toEqual([]);
	});
});
