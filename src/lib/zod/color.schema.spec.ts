import { describe, expect, it } from 'vitest';
import { COLOR_LIMITS, colorSchema, isHexColor, normalizeHexColor } from './color.schema';

const valid = { nombre: 'Azul marino', codigo_hex: '#1E3A8A' };

const errorsOf = (result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
	result.error?.issues.map((issue) => String(issue.path[0])) ?? [];

describe('COLOR_LIMITS', () => {
	it('refleja los límites de la API', () => {
		expect(COLOR_LIMITS.NOMBRE_MAX).toBe(60);
		expect(COLOR_LIMITS.HEX_LENGTH).toBe(7);
	});
});

describe('normalizeHexColor', () => {
	it('agrega la almohadilla, recorta y pasa a mayúsculas', () => {
		expect(normalizeHexColor(' 1e3a8a ')).toBe('#1E3A8A');
		expect(normalizeHexColor('#1e3a8a')).toBe('#1E3A8A');
	});

	it('un valor vacío sigue vacío', () => {
		expect(normalizeHexColor('   ')).toBe('');
	});
});

describe('isHexColor', () => {
	it('acepta 6 dígitos hexadecimales con o sin almohadilla', () => {
		expect(isHexColor('#1E3A8A')).toBe(true);
		expect(isHexColor('1e3a8a')).toBe(true);
	});

	it('rechaza largos distintos y caracteres que no son hexadecimales', () => {
		expect(isHexColor('#FFF')).toBe(false);
		expect(isHexColor('#1E3A8A0')).toBe(false);
		expect(isHexColor('#GGGGGG')).toBe(false);
		expect(isHexColor('')).toBe(false);
	});
});

describe('colorSchema', () => {
	it('acepta un color válido', () => {
		expect(colorSchema.safeParse(valid).success).toBe(true);
	});

	it('recorta el nombre y normaliza el código', () => {
		const result = colorSchema.parse({ nombre: '  Azul marino ', codigo_hex: ' 1e3a8a ' });
		expect(result).toEqual({ nombre: 'Azul marino', codigo_hex: '#1E3A8A' });
	});

	it('exige nombre y un código válido', () => {
		const result = colorSchema.safeParse({ nombre: ' ', codigo_hex: '#12' });
		expect(errorsOf(result)).toEqual(expect.arrayContaining(['nombre', 'codigo_hex']));
	});

	it('un código vacío informa primero que es requerido (el que ve el usuario)', () => {
		const result = colorSchema.safeParse({ ...valid, codigo_hex: '' });
		expect(result.error?.issues[0].message).toBe('El código de color es requerido');
	});

	it('respeta el largo máximo del nombre', () => {
		const nombre = 'a'.repeat(COLOR_LIMITS.NOMBRE_MAX);
		expect(colorSchema.safeParse({ ...valid, nombre }).success).toBe(true);
		expect(colorSchema.safeParse({ ...valid, nombre: `${nombre}a` }).success).toBe(false);
	});
});
