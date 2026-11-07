import { describe, expect, it } from 'vitest';
import { CATEGORIA_LIMITS, categoriaSchema } from './categoria.schema';

const valid = {
	nombre: 'Bombers',
	seccion_id: '33333333-3333-4333-8333-333333333333',
	parent_id: '44444444-4444-4444-8444-444444444444',
	is_visible: true
};

const errorsOf = (result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
	result.error?.issues.map((issue) => String(issue.path[0])) ?? [];

describe('CATEGORIA_LIMITS', () => {
	it('refleja los límites de la API', () => {
		expect(CATEGORIA_LIMITS.NOMBRE_MAX).toBe(100);
	});
});

describe('categoriaSchema', () => {
	it('acepta una categoría válida', () => {
		expect(categoriaSchema.safeParse(valid).success).toBe(true);
	});

	it('recorta el nombre y envía el padre vacío como null', () => {
		const result = categoriaSchema.parse({ ...valid, nombre: '  Bombers ', parent_id: '' });
		expect(result.nombre).toBe('Bombers');
		expect(result.parent_id).toBeNull();
	});

	it('exige nombre y sección', () => {
		const result = categoriaSchema.safeParse({ ...valid, nombre: '  ', seccion_id: '' });
		expect(errorsOf(result)).toEqual(expect.arrayContaining(['nombre', 'seccion_id']));
	});

	it('la sección y el padre deben ser UUID', () => {
		const result = categoriaSchema.safeParse({ ...valid, seccion_id: 'abc', parent_id: 'xyz' });
		expect(errorsOf(result)).toEqual(expect.arrayContaining(['seccion_id', 'parent_id']));
	});

	it('respeta el largo máximo del nombre', () => {
		const nombre = 'a'.repeat(CATEGORIA_LIMITS.NOMBRE_MAX);
		expect(categoriaSchema.safeParse({ ...valid, nombre }).success).toBe(true);
		expect(categoriaSchema.safeParse({ ...valid, nombre: `${nombre}a` }).success).toBe(false);
	});

	it('exige la visibilidad como booleano', () => {
		const result = categoriaSchema.safeParse({ ...valid, is_visible: 'true' });
		expect(errorsOf(result)).toEqual(['is_visible']);
	});
});
