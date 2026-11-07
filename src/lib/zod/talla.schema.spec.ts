import { describe, expect, it } from 'vitest';
import { TALLA_LIMITS, tallaSchema } from './talla.schema';

describe('TALLA_LIMITS', () => {
	it('refleja los límites de la API', () => {
		expect(TALLA_LIMITS.ETIQUETA_MAX).toBe(30);
	});
});

describe('tallaSchema', () => {
	it('acepta etiquetas como "M" o "6-7 años"', () => {
		expect(tallaSchema.safeParse({ etiqueta: 'M' }).success).toBe(true);
		expect(tallaSchema.safeParse({ etiqueta: '6-7 años' }).success).toBe(true);
	});

	it('recorta los espacios de la etiqueta', () => {
		expect(tallaSchema.parse({ etiqueta: '  XL ' }).etiqueta).toBe('XL');
	});

	it('exige una etiqueta no vacía', () => {
		const result = tallaSchema.safeParse({ etiqueta: '   ' });
		expect(result.error?.issues[0].path[0]).toBe('etiqueta');
	});

	it('respeta el largo máximo de la etiqueta', () => {
		const etiqueta = 'a'.repeat(TALLA_LIMITS.ETIQUETA_MAX);
		expect(tallaSchema.safeParse({ etiqueta }).success).toBe(true);
		expect(tallaSchema.safeParse({ etiqueta: `${etiqueta}a` }).success).toBe(false);
	});
});
