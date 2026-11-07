import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { validateSchema, validateSchemaDeep } from './validateSchema';

const schema = z.object({
	nombre: z.string().min(1, 'Nombre requerido'),
	items: z.array(z.object({ precio: z.object({ normal: z.number().min(0, 'Precio inválido') }) }))
});

const invalid = { nombre: '', items: [{ precio: { normal: 1 } }, { precio: { normal: -1 } }] };

describe('validateSchemaDeep', () => {
	it('devuelve los datos si son válidos', () => {
		const result = validateSchemaDeep(schema, { nombre: 'a', items: [] });
		expect(result).toEqual({ success: true, data: { nombre: 'a', items: [] } });
	});

	it('usa la ruta completa de cada campo como clave', () => {
		const result = validateSchemaDeep(schema, invalid);
		expect(result).toEqual({
			success: false,
			errors: { nombre: 'Nombre requerido', 'items.1.precio.normal': 'Precio inválido' }
		});
	});

	it('conserva solo el primer error de cada campo', () => {
		const strict = z.string().min(3, 'corto').regex(/^\d+$/, 'solo números');
		const result = validateSchemaDeep(z.object({ code: strict }), { code: 'a' });
		expect(result).toEqual({ success: false, errors: { code: 'corto' } });
	});
});

describe('validateSchema (sin cambios)', () => {
	it('solo devuelve el primer segmento de la ruta', () => {
		const result = validateSchema(schema, invalid);
		expect(result).toEqual({
			success: false,
			errors: { nombre: 'Nombre requerido', items: 'Precio inválido' }
		});
	});
});
