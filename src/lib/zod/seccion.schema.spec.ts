import { describe, expect, it } from 'vitest';
import { SECCION_LIMITS, seccionSchema } from './seccion.schema';

const errorsOf = (result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
	result.error?.issues.map((issue) => String(issue.path[0])) ?? [];

describe('SECCION_LIMITS', () => {
	it('refleja los límites de la API', () => {
		expect(SECCION_LIMITS.NOMBRE_MAX).toBe(100);
	});
});

describe('seccionSchema', () => {
	it('acepta una sección válida', () => {
		expect(seccionSchema.safeParse({ nombre: 'Mujer', is_visible: true }).success).toBe(true);
	});

	it('recorta los espacios del nombre', () => {
		expect(seccionSchema.parse({ nombre: '  Mujer ', is_visible: false }).nombre).toBe('Mujer');
	});

	it('exige un nombre no vacío', () => {
		const result = seccionSchema.safeParse({ nombre: '   ', is_visible: true });
		expect(errorsOf(result)).toEqual(['nombre']);
	});

	it('respeta el largo máximo del nombre', () => {
		const valid = 'a'.repeat(SECCION_LIMITS.NOMBRE_MAX);
		expect(seccionSchema.safeParse({ nombre: valid, is_visible: true }).success).toBe(true);
		expect(seccionSchema.safeParse({ nombre: `${valid}a`, is_visible: true }).success).toBe(false);
	});

	it('exige la visibilidad como booleano', () => {
		const result = seccionSchema.safeParse({ nombre: 'Mujer', is_visible: 'true' });
		expect(errorsOf(result)).toEqual(['is_visible']);
	});
});
