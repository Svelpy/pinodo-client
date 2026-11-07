import { describe, expect, it } from 'vitest';
import { NO_DATA_LABEL } from '#lib/constants/index.ts';
import { formatInitials, formatPriceRange } from './format';

describe('formatInitials', () => {
	it('toma la inicial de las dos primeras palabras en mayúsculas', () => {
		expect(formatInitials('ana pérez lópez')).toBe('AP');
		expect(formatInitials('Brandon Gonsales Coronado')).toBe('BG');
	});

	it('con una sola palabra devuelve una inicial y ignora espacios sobrantes', () => {
		expect(formatInitials('  Tienda ')).toBe('T');
	});

	it('sin nombre devuelve el texto de respaldo', () => {
		expect(formatInitials(null)).toBe(NO_DATA_LABEL);
		expect(formatInitials('   ', { fallback: '' })).toBe('');
	});
});

describe('formatPriceRange', () => {
	it('muestra desde y hasta cuando difieren', () => {
		const text = formatPriceRange(19.95, 29.95);
		expect(text).toContain('–');
		expect(text).toContain('19,95');
		expect(text).toContain('29,95');
	});

	it('con el mismo precio en ambos extremos muestra uno solo', () => {
		expect(formatPriceRange(10, 10)).not.toContain('–');
	});

	it('si falta un extremo muestra el otro; sin ninguno, el respaldo', () => {
		expect(formatPriceRange(null, 15)).toContain('15');
		expect(formatPriceRange(null, undefined)).toBe(NO_DATA_LABEL);
		expect(formatPriceRange(null, null, 'BOB', { fallback: 'Sin precio' })).toBe('Sin precio');
	});
});
